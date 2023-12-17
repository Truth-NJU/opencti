import {
  createNHEntity,
} from '../database/middleware';
import { storeLoadById } from '../database/middleware-loader';
import { elRawNHSearch, elRawDeleteByQuery } from '../database/engine';
import { logApp } from '../config/conf';
import { ENTITY_TYPE_CONTAINER_ARCH } from '../schema/stixDomainObject';
import {
  storeLoadByIdWithRefs,
} from '../database/middleware';
import { UnsupportedError } from '../config/errors';
import { NHUpload } from '../database/file-storage';
import { buildContextDataForFile, publishUserAction } from '../listener/UserActionListener';

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


export const NHFileUpLoad = async (context, user, id, file, noTriggerImport = false) => {
  // TODO: 注释的部分需要看懂逻辑后加上
  // let lock;
  // const previous = await storeLoadByIdWithRefs(context, user, id);
  // if (!previous) {
  //   throw UnsupportedError('Cant upload a file an none existing element', { id });
  // }
  // const participantIds = getInstanceIds(previous);
  try {
    // Lock the participants that will be merged
    // redis锁相关
    // lock = await lockResource(participantIds);
    // internal_id就是elasticsearch数据库中的_id字段对应的值
    // const { internal_id: internalId } = previous;
    const { filename } = await file;
    // const entitySetting = await getEntitySettingFromCache(context, previous.entity_type);
    // const isAutoExternal = !entitySetting ? false : entitySetting.platform_entity_files_ref;
    // const filePath = `import/${previous.entity_type}/${internalId}`;
    const filePath = `import/nh`;
    logApp.info('[FILE STORAGE] NH File UpLoad', { user_id: user.id, path: filePath, filename });
    // 01. Upload the file
    const meta = {};
    // if (isAutoExternal) {
    //   const key = `${filePath}/${filename}`;
    //   meta.external_reference_id = generateStandardId(ENTITY_TYPE_EXTERNAL_REFERENCE, { url: `/storage/get/${key}` });
    // }
    const up = await NHUpload(context, user, filePath, file, { meta, noTriggerImport, entity: null });
    // 02. Create and link external ref if needed.
    // let addedExternalRef;
    // if (isAutoExternal) {
    //   // Create external ref + link to current entity
    //   const createExternal = { source_name: filename, url: `/storage/get/${up.id}`, fileId: up.id };
    //   const externalRef = await createEntity(context, user, createExternal, ENTITY_TYPE_EXTERNAL_REFERENCE);
    //   const relInput = { fromId: id, toId: externalRef.id, relationship_type: RELATION_EXTERNAL_REFERENCE };
    //   const opts = { publishStreamEvent: false, locks: participantIds };
    //   await createRelationRaw(context, user, relInput, opts);
    //   addedExternalRef = externalRef;
    // }
    // Patch the updated_at to force live stream evolution
    // const eventFile = storeFileConverter(user, up);
    // const files = [...(previous.x_opencti_files ?? []).filter((f) => f.id !== up.id), eventFile];
    // await elUpdateElement({
    //   _index: previous._index,
    //   internal_id: internalId,
    //   updated_at: now(),
    //   x_opencti_files: files
    // });
    // // Stream event generation
    // if (addedExternalRef) {
    //   const newExternalRefs = [...(previous[INPUT_EXTERNAL_REFS] ?? []), addedExternalRef];
    //   const instance = { ...previous, x_opencti_files: files, [INPUT_EXTERNAL_REFS]: newExternalRefs };
    //   const message = `adds \`${up.name}\` in \`files\` and \`external_references\``;
    //   await storeUpdateEvent(context, user, previous, instance, message);
    // } else {
    //   const instance = { ...previous, x_opencti_files: files };
    //   await storeUpdateEvent(context, user, previous, instance, `adds \`${up.name}\` in \`files\``);
    // }
    // Add in activity only for notifications
    // const contextData = buildContextDataForFile(previous, filePath, up.name);
    // await publishUserAction({
    //   user,
    //   event_type: 'file',
    //   event_access: 'extended',
    //   event_scope: 'create',
    //   prevent_indexing: true,
    //   context_data: contextData
    // });
    let FileUpload = {
      fileName: filename,
    }
    return FileUpload;
  } catch (err) {
    // if (err.name === TYPE_LOCK_ERROR) {
    //   throw LockTimeoutError({ participantIds });
    // }
    // throw err;
  } finally {
    // if (lock) await lock.unlock();
  }
};
