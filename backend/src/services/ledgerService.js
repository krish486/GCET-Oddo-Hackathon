const store = require('../models/store');
function list(query = {}) {
  const state = store.read();
  const matchesWarehouse = (entry) => { const location = state.locations.find((item) => item.id === entry.locationId); return !query.warehouseId || location?.warehouseId === query.warehouseId; };
  return state.ledger.filter((entry) => (!query.operationType || entry.operationType === query.operationType) && (!query.productId || entry.productId === query.productId) && (!query.locationId || entry.locationId === query.locationId) && (!query.from || entry.createdAt >= query.from) && (!query.to || entry.createdAt <= `${query.to}T23:59:59.999Z`) && matchesWarehouse(entry)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((entry) => ({ ...entry, product: state.products.find((item) => item.id === entry.productId) || null, location: state.locations.find((item) => item.id === entry.locationId) || null }));
}
module.exports = { list };
