import * as R from 'ramda';
import {
  batchListThroughGetTo,
  createEntity,
} from '../database/middleware';
import { listEntities, storeLoadById } from '../database/middleware-loader';
import { BUS_TOPICS } from '../config/conf';
import { notify } from '../database/redis';
import { ENTITY_TYPE_CONTAINER_REPORT } from '../schema/stixDomainObject';
import { RELATION_OBJECT_PARTICIPANT } from '../schema/stixRefRelationship';
import {
  ABSTRACT_STIX_DOMAIN_OBJECT} from '../schema/general';
import { ENTITY_TYPE_USER } from '../schema/internalObject';

export const findById = (context, user, reportId) => {
  // 通过es查询
  return storeLoadById(context, user, reportId, ENTITY_TYPE_CONTAINER_REPORT);
};

// region mutations
export const addReport = async (context, user, report) => {
  const finalReport = R.assoc('created', report.published, report);
  // 会在es中创建索引
  const created = await createEntity(context, user, finalReport, ENTITY_TYPE_CONTAINER_REPORT);
  return notify(BUS_TOPICS[ABSTRACT_STIX_DOMAIN_OBJECT].ADDED_TOPIC, created, user);
};
