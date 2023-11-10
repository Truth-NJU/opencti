import {
    addArch,
  } from '../domain/nh';
  import { batchLoader } from '../database/middleware';
  
  const participantLoader = batchLoader(batchParticipants);
  
  const archResolvers = {
    Query: {
      arch: (_, { id }, context) => findById(context, context.user, id),
    },
    Mutation: {
      archAdd: (_, { input }, context) => addArch(context, context.user, input),
    },
  };
  
  export default reportResolvers;
  