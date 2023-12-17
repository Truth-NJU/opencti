import { ApolloServer, UserInputError } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageDisabled } from 'apollo-server-core';
import { formatError as apolloFormatError } from 'apollo-errors';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import { dissocPath } from 'ramda';
import ConstraintDirectiveError from 'graphql-constraint-directive/lib/error';
import createSchema from './schema';
import {
  basePath,
  DEV_MODE,
  PLAYGROUND_INTROSPECTION_DISABLED,
  ENABLED_TRACING,
  PLAYGROUND_ENABLED,
  GRAPHQL_ARMOR_ENABLED,
  logApp
} from '../config/conf';
import { authenticateUserFromRequest, userWithOrigin } from '../domain/user';
import { ForbiddenAccess, ValidationError } from '../config/errors';
import loggerPlugin from './loggerPlugin';
import telemetryPlugin from './telemetryPlugin';
import httpResponsePlugin from './httpResponsePlugin';
import { executionContext } from '../utils/access';

// 该文件创建graphql服务
 
// 创建一个Apollo Server实例。该函数配置了一个GraphQL模式、插件和验证规则。
// 函数还设置了Apollo Server的播放场选项，包括标题、favicon和凭据设置。它还配置了服务器处理模式概览请求，并设置了一个上下文函数，用于身份验证用户并设置执行上下文
// Apollo Server是一个用于构建GraphQL API的工具。它提供了一个灵活且可扩展的平台，用于定义和执行GraphQL模式，处理客户端请求，并提供了各种插件和功能，如身份验证、缓存和扩展。它是Apollo Graph Platform的一部分，提供了用于构建和部署GraphQL API的完整解决方案。
const createApolloServer = () => {
  const schema = createSchema();
  const apolloPlugins = [loggerPlugin, httpResponsePlugin];
  const apolloValidationRules = [];
  if (GRAPHQL_ARMOR_ENABLED) {
    const armor = new ApolloArmor({
      costLimit: { // Blocking too expensive requests (DoS attack attempts).
        maxCost: 10000
      },
      blockFieldSuggestion: { // It will prevent suggesting fields in case of an erroneous request.
        enabled: true,
      },
      maxAliases: { // Limit the number of aliases in a document.
        n: 15,
      },
      maxDirectives: { // Limit the number of directives in a document.
        n: 50,
      },
      maxDepth: { // maxDepth: Limit the depth of a document.
        n: 20,
      },
      maxTokens: { // Limit the number of GraphQL tokens in a document.
        n: 2000,
      }
    });
    const protection = armor.protect();
    apolloPlugins.push(...protection.plugins);
    apolloValidationRules.push(...protection.validationRules);
  }
  // In production mode, we use static from the server
  const playgroundOptions = DEV_MODE ? { settings: { 'request.credentials': 'include' } } : {
    cdnUrl: `${basePath}/static`,
    title: 'OpenCTI Playground',
    faviconUrl: `${basePath}/static/@apollographql/graphql-playground-react@1.7.42/build/static/favicon.png`,
    settings: { 'request.credentials': 'include' }
  };
  // ApolloServerPluginLandingPageGraphQLPlayground是一个Apollo Server插件，它的作用是在Apollo Server启动时提供一个GraphQL Playground界面，以便开发人员可以使用它来浏览和测试GraphQL API
  const playgroundPlugin = ApolloServerPluginLandingPageGraphQLPlayground(playgroundOptions);
  apolloPlugins.push(PLAYGROUND_ENABLED ? playgroundPlugin : ApolloServerPluginLandingPageDisabled());
  // Schema introspection must be accessible only for auth users.
  const introspectionPatterns = ['__schema {', '__schema(', '__type {', '__type('];
  const secureIntrospectionPlugin = {
    requestDidStart: ({ request, context }) => {
      // Is schema introspection request
      if (introspectionPatterns.some((pattern) => request.query.includes(pattern))) {
        // If introspection explicitly disabled or user is not authenticated
        if (!PLAYGROUND_ENABLED || PLAYGROUND_INTROSPECTION_DISABLED || !context.user) {
          throw ForbiddenAccess({ reason: 'GraphQL introspection not authorized!' });
        }
      }
    },
  };
  apolloPlugins.push(secureIntrospectionPlugin);
  if (ENABLED_TRACING) {
    apolloPlugins.push(telemetryPlugin);
  }
  const apolloServer = new ApolloServer({
    schema,
    introspection: true, // Will be disabled by plugin if needed
    persistedQueries: false,
    // csrfPrevention: false,
    // uploads: false,
    validationRules: apolloValidationRules,
    async context({ req, res }) {
      const executeContext = executionContext('api');
      executeContext.req = req;
      executeContext.res = res;
      executeContext.synchronizedUpsert = req.headers['synchronized-upsert'] === 'true';
      executeContext.workId = req.headers['opencti-work-id'];
      try {
        const user = await authenticateUserFromRequest(executeContext, req, res);
        if (user) {
          executeContext.user = userWithOrigin(req, user);
        }
      } catch (error) {
        logApp.error('Error in user context building', { error });
      }
      return executeContext;
    },
    tracing: DEV_MODE,
    plugins: apolloPlugins,
    formatError: (error) => {
      let e = apolloFormatError(error);
      if (e instanceof UserInputError) {
        if (e.originalError instanceof ConstraintDirectiveError) {
          const { originalError } = e.originalError;
          const { fieldName } = originalError;
          const ConstraintError = ValidationError(fieldName, originalError);
          e = apolloFormatError(ConstraintError);
        }
      }
      // Remove the exception stack in production.
      return DEV_MODE ? e : dissocPath(['extensions', 'exception'], e);
    },
  });
  return { schema, apolloServer };
};

export default createApolloServer;
