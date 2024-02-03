import { GraphQLDateTime } from 'graphql-scalars';
import { mergeResolvers } from 'merge-graphql-schemas';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { constraintDirective } from 'graphql-constraint-directive';
// eslint-disable-next-line import/extensions
import { GraphQLScalarType, GraphQLError, Kind } from 'graphql/index.js';
import { validate as uuidValidate } from 'uuid';
import { UserInputError } from 'apollo-server-express';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import settingsResolvers from '../resolvers/settings';
import logResolvers from '../resolvers/log';
import attributeResolvers from '../resolvers/attribute';
import subTypeResolvers from '../resolvers/subType';
import labelResolvers from '../resolvers/label';
import rabbitmqMetricsResolvers from '../resolvers/rabbitmqMetrics';
import elasticSearchMetricsResolvers from '../resolvers/elasticSearchMetrics';
import internalObjectResolvers from '../resolvers/internalObject';
import stixObjectOrStixRelationshipOrCreatorResolvers from '../resolvers/stixObjectOrStixRelationshipOrCreator';
import stixObjectOrStixRelationshipResolvers from '../resolvers/stixObjectOrStixRelationship';
import stixCoreObjectResolvers from '../resolvers/stixCoreObject';
import stixDomainObjectResolvers from '../resolvers/stixDomainObject';
import stixCyberObservableResolvers from '../resolvers/stixCyberObservable';
import internalRelationshipResolvers from '../resolvers/internalRelationship';
import stixRelationshipResolvers from '../resolvers/stixRelationship';
import stixCoreRelationshipResolvers from '../resolvers/stixCoreRelationship';
import stixSightingRelationshipResolvers from '../resolvers/stixSightingRelationship';
import identityResolvers from '../resolvers/identity';
import individualResolvers from '../resolvers/individual';
import userResolvers from '../resolvers/user';
import sectorResolvers from '../resolvers/sector';
import systemResolvers from '../resolvers/system';
import locationResolvers from '../resolvers/location';
import cityResolvers from '../resolvers/city';
import countryResolvers from '../resolvers/country';
import regionResolvers from '../resolvers/region';
import positionResolvers from '../resolvers/position';
import groupResolvers from '../resolvers/group';
import markingDefinitionResolvers from '../resolvers/markingDefinition';
import externalReferenceResolvers from '../resolvers/externalReference';
import killChainPhaseResolvers from '../resolvers/killChainPhase';
import attackPatternResolvers from '../resolvers/attackPattern';
import courseOfActionResolvers from '../resolvers/courseOfAction';
import threatActorResolvers from '../resolvers/threatActor';
import intrusionSetResolvers from '../resolvers/intrusionSet';
import infrastructureResolvers from '../resolvers/infrastructure';
import campaignResolvers from '../resolvers/campaign';
import malwareResolvers from '../resolvers/malware';
import toolResolvers from '../resolvers/tool';
import vulnerabilityResolvers from '../resolvers/vulnerability';
import reportResolvers from '../resolvers/report';
import containerResolvers from '../resolvers/container';
import noteResolvers from '../resolvers/note';
import observedDataResolvers from '../resolvers/observedData';
import opinionResolvers from '../resolvers/opinion';
import indicatorResolvers from '../resolvers/indicator';
import incidentResolvers from '../resolvers/incident';
import { authDirectiveBuilder } from './authDirective';
import connectorResolvers from '../resolvers/connector';
import fileResolvers from '../resolvers/file';
import globalTypeDefs from '../../config/schema/opencti.graphql';
import organizationOrIndividualResolvers from '../resolvers/organizationOrIndividual';
import taxiiResolvers from '../resolvers/taxii';
import feedResolvers from '../resolvers/feed';
import taskResolvers from '../resolvers/backgroundTask';
import retentionResolvers from '../resolvers/retentionRule';
import streamResolvers from '../resolvers/stream';
import statusResolvers from '../resolvers/status';
import ruleResolvers from '../resolvers/rule';
import stixResolvers from '../resolvers/stix';
import { isSupportedStixType } from '../schema/identifier';
import stixRefRelationshipResolvers from '../resolvers/stixRefRelationship';
import stixMetaObjectResolvers from '../resolvers/stixMetaObject';
import archResolvers from '../resolvers/nh';

const schemaTypeDefs = [globalTypeDefs];

// 验证stixid的正确性
const validateStixId = (stixId) => {
  if (!stixId.includes('--')) {
    throw new UserInputError(`Provided value ${stixId} is not a valid STIX ID`);
  }
  const [type, uuid] = stixId.split('--');
  if (!isSupportedStixType(type.replace('x-mitre-', '').replace('x-opencti-', ''))) {
    throw new UserInputError(`Provided value ${stixId} is not a valid STIX ID (type ${type} not supported)`);
  }
  if (!uuidValidate(uuid)) {
    throw new UserInputError(`Provided value ${stixId} is not a valid STIX ID (UUID not valid)`);
  }
  return stixId;
};

const validateStixRef = (stixRef) => {
  if (stixRef === null) {
    return stixRef;
  }
  if (stixRef.includes('--')) {
    return validateStixId(stixRef);
  }
  if (uuidValidate(stixRef)) {
    return stixRef;
  }
  throw new UserInputError('Provided value is not a valid STIX Reference');
};

const parseObject = (ast) => {
  const value = Object.create(null);
  ast.fields.forEach((field) => {
    value[field.name.value] = parseAst(field.value);
  });
  return value;
};

const parseAst = (ast) => {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
      return parseInt(ast.value, 10);
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT:
      return parseObject(ast);
    case Kind.LIST:
      return ast.values.map(parseAst);
    default:
      return null;
  }
};

const globalResolvers = {
  DateTime: GraphQLDateTime,
  Upload: GraphQLUpload,
  StixId: new GraphQLScalarType({
    name: 'StixId',
    description: 'STIX ID Scalar Type',
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return validateStixId(value);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return validateStixId(ast.value);
      }
      throw new UserInputError('Provided value is not a valid STIX ID');
    },
  }),
  StixRef: new GraphQLScalarType({
    name: 'StixRef',
    description: 'STIX Reference Scalar Type',
    serialize(value) {
      return value;
    },
    parseValue(value) {
      return validateStixRef(value);
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return validateStixRef(ast.value);
      }
      throw new UserInputError('Provided value is not a valid STIX ID');
    },
  }),
  Any: new GraphQLScalarType({
    name: 'Any',
    description: 'Arbitrary object',
    serialize: () => { throw new GraphQLError('Any serialization unsupported.'); },
    parseValue: (value) => value,
    parseLiteral: (ast) => parseAst(ast)
  }),
};


const schemaResolvers = [
  // INTERNAL
  globalResolvers,
  taxiiResolvers,
  feedResolvers,
  streamResolvers,
  statusResolvers,
  logResolvers,
  rabbitmqMetricsResolvers,
  elasticSearchMetricsResolvers,
  attributeResolvers,
  subTypeResolvers,
  fileResolvers,
  taskResolvers,
  retentionResolvers,
  stixResolvers,
  // ENTITIES
  // INTERNAL OBJECT ENTITIES
  internalObjectResolvers,
  settingsResolvers,
  groupResolvers,
  userResolvers,
  connectorResolvers,
  // STIX OBJECT ENTITIES
  // STIX META OBJECT ENTITIES
  stixMetaObjectResolvers,
  markingDefinitionResolvers,
  labelResolvers,
  externalReferenceResolvers,
  killChainPhaseResolvers,
  // STIX CORE OBJECT ENTITIES
  stixCoreObjectResolvers,
  // STIX DOMAIN OBJECT ENTITIES
  stixDomainObjectResolvers,
  attackPatternResolvers,
  campaignResolvers,
  // Containers
  containerResolvers,
  noteResolvers,
  observedDataResolvers,
  opinionResolvers,
  reportResolvers,
  courseOfActionResolvers,
  // Identities
  identityResolvers,
  individualResolvers,
  sectorResolvers,
  systemResolvers,
  // Others
  indicatorResolvers,
  infrastructureResolvers,
  intrusionSetResolvers,
  ruleResolvers,
  // Locations
  locationResolvers,
  cityResolvers,
  countryResolvers,
  regionResolvers,
  positionResolvers,
  // Others
  malwareResolvers,
  threatActorResolvers,
  toolResolvers,
  vulnerabilityResolvers,
  incidentResolvers,
  // STIX CYBER OBSERVABLE ENTITIES
  stixCyberObservableResolvers,
  // INTERNAL RELATIONSHIPS
  internalRelationshipResolvers,
  // STIX RELATIONSHIPS
  stixRelationshipResolvers,
  // STIX CORE RELATIONSHIPS
  stixCoreRelationshipResolvers,
  // STIX SIGHTING RELATIONSHIPS
  stixSightingRelationshipResolvers,
  // STIX REF RELATIONSHIPS
  stixRefRelationshipResolvers,
  // ALL
  organizationOrIndividualResolvers,
  stixObjectOrStixRelationshipResolvers,
  stixObjectOrStixRelationshipOrCreatorResolvers,
  archResolvers
];
export const registerGraphqlSchema = ({ schema, resolver }) => {
  schemaTypeDefs.push(schema);
  schemaResolvers.push(resolver);
};

const registerNHGraphqlSchema = () => {
  const { gql } = require("apollo-server-koa");
  // const typeDefs = gql`
  //     type Arch {
  //       id: ID!
  //       title: String!
  //       author: String!
  //     }
  //     type Query {
  //       arch(id:ID!): Arch
  //     }
  //     type Mutation {
  //       archAdd(title: String!, author: String!): Arch
  //     }
  // `;
  const archDefs = gql`
      type Arch {
        id: String
        tm: String
        ym: String
        zzyuanm: String
        zzyim: String
        bzyuanm: String
        bzyim: String
        yzyuanm: String
        yzyim: String
        gjc: String
        lh1: String
        lh2: String
        lh3: String
        zwzy: String
        wwzy: String
        mc: String
        cb: String
        pf: String
        xltm: String
        fz: String
        zzjg: String
        cbd: String
        cbjg: String
        bc: String
        bh: String
        ysjg: String
        cbrq: String
        cjrq: String
        ysrq: String
        chrq: String
        fxrq: String
        isbn: String
        issn: String
        isrc: String
        csbh: String
        hf: String
        secai: String
        cc: String
        sc: String
        qsy: String
        gcd: String
        url: String
        hymc: String
        km: String
        qs: String
        yz: String
        dm: String
        gb: String
        xwmc: String
        xkzy: String
        ds: String
        xwsydw: String
        blc: String
        tkfw: String
        fbjg: String
        pzjg: String
        qt1: String
        qt2: String
        yema: String
        pdf: String
        txt: String
        bz: String
      }
      input ArchInput{
        tm: String
        ym: String
        zzyuanm: String
        zzyim: String
        bzyuanm: String
        bzyim: String
        yzyuanm: String
        yzyim: String
        gjc: String
        lh1: String
        lh2: String
        lh3: String
        zwzy: String
        wwzy: String
        mc: String
        cb: String
        pf: String
        xltm: String
        fz: String
        zzjg: String
        cbd: String
        cbjg: String
        bc: String
        bh: String
        ysjg: String
        cbrq: String
        cjrq: String
        ysrq: String
        chrq: String
        fxrq: String
        isbn: String
        issn: String
        isrc: String
        csbh: String
        hf: String
        secai: String
        cc: String
        sc: String
        qsy: String
        gcd: String
        url: String
        hymc: String
        km: String
        qs: String
        yz: String
        dm: String
        gb: String
        xwmc: String
        xkzy: String
        ds: String
        xwsydw: String
        blc: String
        tkfw: String
        fbjg: String
        pzjg: String
        qt1: String
        qt2: String
        yema: String
        pdf: String
        txt: String
        bz: String
      }
      type ArchDelete {
        indexName: String!
      }
      type FileUpload {
        fileName: String!
      }
      type Query {
        arch(id:String): Arch
        allArchs(indexName: String!): [Arch]
      }
      type Mutation {
        archAdd(input: ArchInput): Arch
        archDelete(indexName: String!): ArchDelete
        uploadFile(file: Upload!): FileUpload
      }
  `;
  schemaTypeDefs.push(archDefs);
  schemaResolvers.push(archResolvers);
};

// 用于创建和返回一个GraphQL模式
// GraphQL模式（schema）是一个定义了GraphQL API的类型系统的核心部分。它描述了API提供的数据结构和可用的查询操作。
// 模式定义了可用的对象类型、字段、查询操作以及其他相关的元素。通过模式，客户端可以发出查询请求，并获取符合模式定义的数据。
// 相当于后端接口
const createSchema = () => {
  // Merge resolvers
  // 在GraphQL中，mergeResolvers方法用于合并多个解析器对象（schemaResolvers），以创建一个统一的解析器。
  // mergeResolvers方法接受一个或多个解析器对象作为参数，并将它们合并成一个单一的解析器对象。合并后的解析器对象将包含所有传入解析器对象中定义的查询、变更和订阅字段解析器。
  // 通过使用mergeResolvers方法，开发人员可以将多个不同的解析器对象组合在一起，以形成一个完整的解析器。这样可以方便地将不同的解析器逻辑组织在一起，使得整个GraphQL服务器的解析器逻辑更加清晰和可维护。
  registerNHGraphqlSchema();
  const resolvers = mergeResolvers(schemaResolvers);
  const { authDirectiveTransformer } = authDirectiveBuilder('auth');
  let schema = makeExecutableSchema({
    typeDefs: schemaTypeDefs,
    resolvers,
    inheritResolversFromInterfaces: true,
  });
  schema = constraintDirective()(schema);
  schema = authDirectiveTransformer(schema);
  return schema;
};

export default createSchema;
