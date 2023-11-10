import {
    addArch,
  } from '../domain/nh';
  
  const archResolvers = {
    Query: {
      arch: (_, { id }, context) => findById(context, context.user, id),
    },
    Mutation: {
      archAdd: (_, { input }, context) => addArch(context, context.user, input),
    },
  };
  
  export default archResolvers;
  