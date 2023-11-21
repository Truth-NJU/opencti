import {
    addArch,
    findById,
    findAllArchs,
    deleteArch
  } from '../domain/nh';
  
  const archResolvers = {
    Query: {
      arch: (_, { id }, context) => findById(context, context.user, id),
      allArchs:(_, {indexName}, context) => findAllArchs(context, context.user, indexName),
    },
    // Mutation: {
    //   archAdd: (_, { title, author }, context) => addArch(context, context.user, title, author),
    // },
    Mutation: {
      archAdd: (_, { input }, context) => addArch(context, context.user, input),
      archDelete:(_, {indexName}, context) => deleteArch(context, context.user, indexName),
    },
  };
  
  export default archResolvers;
  