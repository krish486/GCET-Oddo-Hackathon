const operation = require('../services/operationService');
const make = (type) => ({
  list: ({ query }) => ({ data: operation.list(type, query) }),
  get: ({ params }) => ({ data: operation.get(type, params.id) }),
  create: ({ body, user }) => ({ data: operation.create(type, body, user.id), message: `${type} created.`, status: 201 }),
  validate: ({ params, user }) => ({ data: operation.validate(type, params.id, user.id), message: `${type} validated and stock updated.` }),
  pick: ({ params }) => ({ data: operation.transition(type, params.id, 'pick'), message: `${type} marked as waiting.` }),
  pack: ({ params }) => ({ data: operation.transition(type, params.id, 'pack'), message: `${type} marked as ready.` }),
  cancel: ({ params }) => ({ data: operation.transition(type, params.id, 'cancel'), message: `${type} canceled.` }),
});
module.exports = { receipt: make('receipt'), delivery: make('delivery'), transfer: make('transfer'), adjustment: make('adjustment') };
