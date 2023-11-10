import * as R from 'ramda';
import {
  createEntity,
} from '../database/middleware';
import { storeLoadById } from '../database/middleware-loader';
import { BUS_TOPICS } from '../config/conf';
import { notify } from '../database/redis';
import { ENTITY_TYPE_CONTAINER_ARCH } from '../schema/stixDomainObject';
import {
  ABSTRACT_NH_OBJECT} from '../schema/general';

export const findById = (context, user, archId) => {
  // 通过es查询
  return storeLoadById(context, user, archId, ENTITY_TYPE_CONTAINER_ARCH);
};

// region mutations
export const addArch = async (context, user, arch) => {
  const finalArch = R.assoc('created', arch.published, arch);
  // 会在es中创建索引
  const created = await createEntity(context, user, finalArch, ENTITY_TYPE_CONTAINER_ARCH);
  return notify(BUS_TOPICS[ABSTRACT_NH_OBJECT].ADDED_TOPIC, created, user);
};
