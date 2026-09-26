const fs = require('node:fs');
const path = require('node:path');
const { hashPassword } = require('../utils/security');

const dataFile = () => process.env.DATA_FILE || path.join(__dirname, '../../data/stocksense.json');
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

function seedState() {
  const createdAt = now();
  const user = { id: 'usr_demo_manager', name: 'Demo Manager', email: 'manager@stocksense.app', passwordHash: hashPassword('Demo123!'), role: 'manager', createdAt, updatedAt: createdAt };
  const category = { id: 'cat_metals', name: 'Raw Materials', description: 'Raw material inventory', createdAt };
  const warehouse = { id: 'wh_main', name: 'Main Warehouse', code: 'MAIN', address: 'StockSense Demo Facility', createdAt };
  const main = { id: 'loc_main_store', warehouseId: warehouse.id, name: 'Main Store', code: 'MAIN-ST', parentId: null, createdAt };
  const rack = { id: 'loc_production_rack', warehouseId: warehouse.id, name: 'Production Rack', code: 'PROD-R1', parentId: null, createdAt };
  const product = { id: 'prd_steel', name: 'Steel', sku: 'STL-001', categoryId: category.id, unit: 'kg', reorderLevel: 25, description: 'Demo stock for the end-to-end workflow', active: true, createdAt, updatedAt: createdAt };
  return {
    users: [user], categories: [category], warehouses: [warehouse], locations: [main, rack], products: [product],
    stocks: [{ id: 'stk_steel_main', productId: product.id, locationId: main.id, quantity: 100, updatedAt: createdAt }, { id: 'stk_steel_rack', productId: product.id, locationId: rack.id, quantity: 20, updatedAt: createdAt }],
    operations: [],
    ledger: [{ id: 'led_seed_receipt', productId: product.id, locationId: main.id, quantityChange: 100, balanceAfter: 100, operationType: 'initial', documentId: 'seed', documentNumber: 'SEED-001', note: 'Seeded opening balance', createdAt }, { id: 'led_seed_transfer_out', productId: product.id, locationId: main.id, quantityChange: -20, balanceAfter: 80, operationType: 'transfer', documentId: 'seed', documentNumber: 'SEED-002', note: 'Seeded production allocation', createdAt }, { id: 'led_seed_transfer_in', productId: product.id, locationId: rack.id, quantityChange: 20, balanceAfter: 20, operationType: 'transfer', documentId: 'seed', documentNumber: 'SEED-002', note: 'Seeded production allocation', createdAt }],
    passwordResets: [], revokedTokens: [], createdAt,
  };
}

function ensure() {
  const file = dataFile();
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(seedState(), null, 2));
  }
}
function read() { ensure(); return JSON.parse(fs.readFileSync(dataFile(), 'utf8')); }
function write(state) { fs.mkdirSync(path.dirname(dataFile()), { recursive: true }); fs.writeFileSync(dataFile(), JSON.stringify(state, null, 2)); }
function transaction(work) { const state = clone(read()); const result = work(state); write(state); return clone(result); }
function id(prefix) { return `${prefix}_${require('node:crypto').randomUUID().replaceAll('-', '').slice(0, 12)}`; }
function reset(state = seedState()) { write(state); return state; }

module.exports = { read, transaction, id, reset, seedState };
