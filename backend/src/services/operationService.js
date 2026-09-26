const store = require('../models/store');
const inventory = require('./inventoryService');
const { fail } = require('../utils/http');
const { DOCUMENT_STATUS, OPERATION_TYPES } = require('../constants');

const collectionByType = { receipt: 'receipt', delivery: 'delivery', transfer: 'transfer', adjustment: 'adjustment' };
const title = (type) => `${type[0].toUpperCase()}${type.slice(1)}`;
const assertType = (type) => { if (!collectionByType[type]) fail(404, 'UNKNOWN_OPERATION', 'Unknown inventory operation.'); };
const positive = (value, label = 'Quantity') => { const number = Number(value); if (!Number.isFinite(number) || number <= 0) fail(422, 'INVALID_QUANTITY', `${label} must be greater than zero.`); return number; };
const physical = (value) => { const number = Number(value); if (!Number.isFinite(number) || number < 0) fail(422, 'INVALID_PHYSICAL_QUANTITY', 'Physical quantity must be zero or greater.'); return number; };

function normalizeLines(lines, type, state) {
  if (!Array.isArray(lines) || !lines.length) fail(422, 'LINE_ITEMS_REQUIRED', 'Add at least one product line.');
  return lines.map((line) => {
    if (!state.products.some((product) => product.id === line.productId)) fail(422, 'INVALID_PRODUCT', 'One of the selected products does not exist.');
    return type === OPERATION_TYPES.ADJUSTMENT ? { productId: line.productId, physicalQuantity: physical(line.physicalQuantity) } : { productId: line.productId, quantity: positive(line.quantity) };
  });
}
function ensureLocation(state, id, fieldName) { if (!id || !state.locations.some((location) => location.id === id)) fail(422, 'INVALID_LOCATION', `${fieldName} must be a valid location.`); }
function create(type, input, userId) {
  assertType(type);
  return store.transaction((state) => {
    if (type === OPERATION_TYPES.RECEIPT || type === OPERATION_TYPES.ADJUSTMENT) ensureLocation(state, input.destinationLocationId || input.locationId, type === OPERATION_TYPES.RECEIPT ? 'Destination location' : 'Adjustment location');
    if (type === OPERATION_TYPES.DELIVERY) ensureLocation(state, input.sourceLocationId, 'Source location');
    if (type === OPERATION_TYPES.TRANSFER) { ensureLocation(state, input.sourceLocationId, 'Source location'); ensureLocation(state, input.destinationLocationId, 'Destination location'); if (input.sourceLocationId === input.destinationLocationId) fail(422, 'SAME_LOCATION_TRANSFER', 'Source and destination locations must be different.'); }
    const lines = normalizeLines(input.lines, type, state);
    const count = state.operations.filter((operation) => operation.type === type).length + 1;
    const document = { id: store.id('op'), type, number: `${type.slice(0, 3).toUpperCase()}-${String(count).padStart(4, '0')}`, status: DOCUMENT_STATUS.DRAFT, supplier: String(input.supplier || ''), customer: String(input.customer || ''), sourceLocationId: input.sourceLocationId || null, destinationLocationId: input.destinationLocationId || null, locationId: input.locationId || null, note: String(input.note || ''), lines, createdBy: userId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    state.operations.push(document);
    return document;
  });
}
function enrich(state, operation) { return { ...operation, sourceLocation: state.locations.find((location) => location.id === operation.sourceLocationId) || null, destinationLocation: state.locations.find((location) => location.id === operation.destinationLocationId) || null, location: state.locations.find((location) => location.id === operation.locationId) || null, lines: operation.lines.map((line) => ({ ...line, product: state.products.find((product) => product.id === line.productId) || null })) }; }
function list(type, query = {}) { assertType(type); const state = store.read(); return state.operations.filter((operation) => operation.type === type && (!query.status || operation.status === query.status) && (!query.locationId || [operation.sourceLocationId, operation.destinationLocationId, operation.locationId].includes(query.locationId))).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((operation) => enrich(state, operation)); }
function get(type, id) { assertType(type); const state = store.read(); const operation = state.operations.find((item) => item.id === id && item.type === type); if (!operation) fail(404, 'NOT_FOUND', `${title(type)} was not found.`); return enrich(state, operation); }
function transition(type, id, action) {
  assertType(type);
  if (type !== OPERATION_TYPES.DELIVERY && (action === 'pick' || action === 'pack')) fail(422, 'INVALID_ACTION', 'Only delivery orders support picking and packing.');
  return store.transaction((state) => {
    const document = state.operations.find((item) => item.id === id && item.type === type);
    if (!document) fail(404, 'NOT_FOUND', `${title(type)} was not found.`);
    if (document.status === DOCUMENT_STATUS.DONE || document.status === DOCUMENT_STATUS.CANCELED) fail(409, 'INVALID_STATUS_CHANGE', 'Completed or canceled documents cannot be changed.');
    const next = action === 'pick' ? DOCUMENT_STATUS.WAITING : action === 'pack' ? DOCUMENT_STATUS.READY : action === 'cancel' ? DOCUMENT_STATUS.CANCELED : null;
    if (!next) fail(422, 'INVALID_ACTION', 'Unsupported status action.');
    document.status = next; document.updatedAt = new Date().toISOString();
    return enrich(state, document);
  });
}
function validate(type, id, userId) {
  assertType(type);
  return store.transaction((state) => {
    const document = state.operations.find((item) => item.id === id && item.type === type);
    if (!document) fail(404, 'NOT_FOUND', `${title(type)} was not found.`);
    if (document.status === DOCUMENT_STATUS.DONE) fail(409, 'ALREADY_VALIDATED', 'This document has already been validated.');
    if (document.status === DOCUMENT_STATUS.CANCELED) fail(409, 'CANCELED_DOCUMENT', 'A canceled document cannot be validated.');
    const movement = (productId, locationId, delta, note) => inventory.applyMovement(state, { productId, locationId, delta, operationType: type, documentId: document.id, documentNumber: document.number, note: note || document.note, userId });
    if (type === OPERATION_TYPES.RECEIPT) document.lines.forEach((line) => movement(line.productId, document.destinationLocationId, line.quantity, `Receipt from ${document.supplier || 'supplier'}`));
    if (type === OPERATION_TYPES.DELIVERY) document.lines.forEach((line) => movement(line.productId, document.sourceLocationId, -line.quantity, `Delivery to ${document.customer || 'customer'}`));
    if (type === OPERATION_TYPES.TRANSFER) document.lines.forEach((line) => { movement(line.productId, document.sourceLocationId, -line.quantity, 'Transfer out'); movement(line.productId, document.destinationLocationId, line.quantity, 'Transfer in'); });
    if (type === OPERATION_TYPES.ADJUSTMENT) document.lines.forEach((line) => { const existing = inventory.getBalance(state, line.productId, document.locationId); const current = existing ? existing.quantity : 0; const delta = line.physicalQuantity - current; if (delta !== 0) movement(line.productId, document.locationId, delta, 'Physical stock adjustment'); });
    document.status = DOCUMENT_STATUS.DONE; document.validatedAt = new Date().toISOString(); document.validatedBy = userId; document.updatedAt = document.validatedAt;
    return enrich(state, document);
  });
}
module.exports = { create, list, get, transition, validate };
