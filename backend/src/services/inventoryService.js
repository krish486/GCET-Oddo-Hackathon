const store = require('../models/store');
const { fail } = require('../utils/http');

const quantity = (value, label = 'Quantity') => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) fail(422, 'INVALID_QUANTITY', `${label} must be a non-negative number.`);
  return parsed;
};
function getBalance(state, productId, locationId) { return (state.stocks || []).find((s) => s.productId === productId && s.locationId === locationId); }
function applyMovement(state, { productId, locationId, delta, operationType, documentId, documentNumber, note = '', userId }) {
  if (!state.products.some((p) => p.id === productId)) fail(422, 'INVALID_PRODUCT', 'One of the selected products does not exist.');
  if (!state.locations.some((l) => l.id === locationId)) fail(422, 'INVALID_LOCATION', 'One of the selected locations does not exist.');
  const change = Number(delta);
  if (!Number.isFinite(change) || change === 0) fail(422, 'INVALID_QUANTITY', 'A stock movement must change quantity.');
  let balance = getBalance(state, productId, locationId);
  const current = balance ? Number(balance.quantity) : 0;
  const after = current + change;
  if (after < 0) fail(409, 'INSUFFICIENT_STOCK', 'Insufficient stock is available at the selected location.', { productId, locationId, available: current, requested: Math.abs(change) });
  const timestamp = new Date().toISOString();
  if (!balance) { balance = { id: store.id('stk'), productId, locationId, quantity: 0, updatedAt: timestamp }; state.stocks.push(balance); }
  balance.quantity = after;
  balance.updatedAt = timestamp;
  const entry = { id: store.id('led'), productId, locationId, quantityChange: change, balanceAfter: after, operationType, documentId, documentNumber, note, userId, createdAt: timestamp };
  state.ledger.push(entry);
  return { balance: { ...balance }, ledgerEntry: entry };
}
function availability(state, productId) { return state.stocks.filter((s) => s.productId === productId).map((s) => ({ ...s, location: state.locations.find((l) => l.id === s.locationId), warehouse: state.warehouses.find((w) => w.id === state.locations.find((l) => l.id === s.locationId)?.warehouseId) })); }
function listStock(query = {}) { const state = store.read(); return state.stocks.filter((s) => { const location = state.locations.find((l) => l.id === s.locationId); return (!query.productId || s.productId === query.productId) && (!query.locationId || s.locationId === query.locationId) && (!query.warehouseId || location?.warehouseId === query.warehouseId); }).map((s) => ({ ...s, product: state.products.find((p) => p.id === s.productId), location: state.locations.find((l) => l.id === s.locationId) })); }
module.exports = { quantity, getBalance, applyMovement, availability, listStock };
