import https from 'node:https';
import http from 'node:http';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { SubscriptionServer } from 'subscriptions-transport-ws';
// eslint-disable-next-line import/extensions
import { execute, subscribe } from 'graphql/index.js';
import nconf from 'nconf';
import express from 'express';
import passport from 'passport/lib';
import conf, { basePath, booleanConf, loadCert, logApp, PORT } from '../config/conf';
import createApp from './httpPlatform';
import createApolloServer from '../graphql/graphql';
import { isStrategyActivated, STRATEGY_CERT } from '../config/providers';
import { applicationSession } from '../database/session';
import { checkSystemDependencies } from '../initialization';
import { executionContext } from '../utils/access';

const MIN_20 = 20 * 60 * 1000;
const REQ_TIMEOUT = conf.get('app:request_timeout');
const CERT_KEY_PATH = conf.get('app:https_cert:key');
const CERT_KEY_CERT = conf.get('app:https_cert:crt');
const CA_CERTS = conf.get('app:https_cert:ca');
const rejectUnauthorized = booleanConf('app:https_cert:reject_unauthorized', true);

const onHealthCheck = () => checkSystemDependencies();

// 创建一个HTTP服务器。它还设置了一个WebSocket服务器，用于支持GraphQL订阅。
const createHttpServer = async () => {
  const app = express();
  app.use(applicationSession.session);
  app.use(passport.initialize({}));
  const { schema, apolloServer } = createApolloServer();
  let httpServer;
  if (CERT_KEY_PATH && CERT_KEY_CERT) {
    const key = loadCert(CERT_KEY_PATH);
    const cert = loadCert(CERT_KEY_CERT);
    const ca = CA_CERTS.map((path) => loadCert(path));
    const requestCert = isStrategyActivated(STRATEGY_CERT);
    const passphrase = conf.get('app:https_cert:passphrase');
    const options = { key, cert, passphrase, requestCert, rejectUnauthorized, ca };
    httpServer = https.createServer(options, app);
  } else {
    httpServer = http.createServer(app);
  }
  httpServer.setTimeout(REQ_TIMEOUT || MIN_20);
  // subscriptionServer
  // subscriptionServer通常与GraphQL一起使用，以便在GraphQL查询或变更操作之外提供实时数据更新。
  // 它可以与各种后端技术（如RESTful API、数据库、消息队列等）集成，以便在数据发生更改时通知客户端。
  // subscriptionServer提供了一种简单而有效的方式来处理实时数据更新，使客户端能够及时获取最新的数据。
  const subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      async onConnect(connectionParams, webSocket) {
        const wsSession = await new Promise((resolve) => {
          // use same session parser as normal gql queries
          const { session } = applicationSession;
          session(webSocket.upgradeReq, {}, () => {
            if (webSocket.upgradeReq.session) {
              resolve(webSocket.upgradeReq.session);
            }
            return false;
          });
        });
        // We have a good session. attach to context
        if (wsSession.user) {
          const context = executionContext('api');
          const origin = {
            socket: 'subscription',
            ip: webSocket._socket.remoteAddress,
            user_id: wsSession.user?.id,
            group_ids: wsSession.user?.group_ids,
            organization_ids: wsSession.user?.organizations?.map((o) => o.internal_id) ?? [],
          };
          context.user = { ...wsSession.user, origin };
          return context;
        }
        throw new Error('User must be authenticated');
      },
    },
    {
      server: httpServer,
      path: `${basePath}${apolloServer.graphqlPath}`,
    }
  );
  apolloServer.plugins.push({
    async serverWillStart() {
      return {
        async drainServer() {
          subscriptionServer.close();
        },
      };
    },
  });
  await apolloServer.start();
  const requestSizeLimit = nconf.get('app:max_payload_body_size') || '50mb';
  app.use(graphqlUploadExpress());
  apolloServer.applyMiddleware({
    app,
    cors: true,
    bodyParserConfig: { limit: requestSizeLimit },
    onHealthCheck,
    path: `${basePath}/graphql`,
  });
  const { sseMiddleware } = await createApp(app);
  return { httpServer, sseMiddleware };
};

const listenServer = async () => {
  return new Promise((resolve, reject) => {
    try {
      const serverPromise = createHttpServer();
      serverPromise.then(({ httpServer, sseMiddleware }) => {
        httpServer.on('close', () => {
          sseMiddleware.shutdown();
        });
        const server = httpServer.listen(PORT);
        resolve({ server });
      });
    } catch (e) {
      logApp.error('[OPENCTI] API start fail', { error: e });
      reject(e);
    }
  });
};

const stopServer = async ({ server }) => {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
    server.emit('close'); // force server close
  });
};

const initHttpServer = () => {
  let server;
  return {
    start: async () => {
      server = await listenServer();
    },
    shutdown: async () => {
      if (server) {
        await stopServer(server);
      }
    },
  };
};
const httpServer = initHttpServer();

export default httpServer;
