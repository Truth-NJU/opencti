import {
    addArch,
    findById
  } from '../domain/nh';
  
  const archResolvers = {
    Query: {
      arch: (_, { id }, context) => findById(context, context.user, id),
    },
    // Mutation: {
    //   archAdd: (_, { title, author }, context) => addArch(context, context.user, title, author),
    // },
    Mutation: {
      archAdd: (_, { input }, context) => addArch(context, context.user, input),
    },
  };
  
  export default archResolvers;
  