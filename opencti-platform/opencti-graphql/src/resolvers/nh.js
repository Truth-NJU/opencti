import {
    addReport,
  } from '../domain/nh';
  import { batchLoader } from '../database/middleware';
  
  const participantLoader = batchLoader(batchParticipants);
  
  const reportResolvers = {
    Query: {
      report: (_, { id }, context) => findById(context, context.user, id),
    },
    Mutation: {
      reportAdd: (_, { input }, context) => addReport(context, context.user, input),
    },
  };
  
  export default reportResolvers;
  