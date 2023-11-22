import * as R from 'ramda';
import {
  createNHEntity,
} from '../database/middleware';
import { storeLoadById } from '../database/middleware-loader';
import { elRawNHSearch, elRawDeleteByQuery } from '../database/engine';
import { BUS_TOPICS, logApp } from '../config/conf';
import { notify } from '../database/redis';
import { ENTITY_TYPE_CONTAINER_ARCH } from '../schema/stixDomainObject';
import {
  ABSTRACT_NH_OBJECT
} from '../schema/general';

export const findById = (context, user, archId) => {
  logApp.info(`[NH] Find by id [${archId}]`);
  // 通过es查询
  return storeLoadById(context, user, archId, ENTITY_TYPE_CONTAINER_ARCH);
};

export const findAllArchs = (context, user, indexName) => {
  const query = {
    index: indexName,
    body: {
      query: {
        match_all: {} // 查询索引下的所有的文档
      }
    }
  };
  logApp.info(`[NH] Find archs in index: [${indexName}]`);
  // 通过es查询
  return elRawNHSearch(query);
};


export const deleteArch = (context, user, indexName) => {
  const query = {
    index: indexName,
    body: {
      query: {
        match_all: {} // 查询索引下的所有的文档
      }
    }
  };
  logApp.info(`[NH] delete all archs under [${indexName}]`);
  // 通过es查询
  elRawDeleteByQuery(query);
  let ArchDelete = {
    indexName: indexName,
  }
  return ArchDelete;
};

export const addArch = async (context, user, input) => {
  // const finalArch = R.assoc('created', arch.published, arch);
  const arch = input
  // 会在es中创建索引
  const created = await createNHEntity(context, user, arch, ENTITY_TYPE_CONTAINER_ARCH);
  return arch;
};
