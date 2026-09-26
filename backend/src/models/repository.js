const store = require('./store');
const { fail } = require('../utils/http');

function repository(collection, label) {
  const list = () => store.read()[collection] || [];
  const find = (id, state = store.read()) => {
    const record = (state[collection] || []).find((item) => item.id === id);
    if (!record) fail(404, 'NOT_FOUND', `${label} was not found.`);
    return record;
  };
  return { list, find };
}
module.exports = repository;
