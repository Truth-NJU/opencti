import {
    addArch,
    findById
  } from '../domain/nh';
  
  const archResolvers = {
    Query: {
      arch: (_, { id }, context) => findById(context, context.user, id),
    },
    Mutation: {
      archAdd: (_, { title, author }, context) => addArch(context, context.user, title, author),
    },
  };
  
  export default archResolvers;
  