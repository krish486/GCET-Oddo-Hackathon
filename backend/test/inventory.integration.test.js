const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'stocksense-api-'));
process.env.DATA_FILE = path.join(testDirectory, 'stocksense.json');

const store = require('../src/models/store');
const { createApp } = require('../src/app');

let server;
let baseUrl;

const request = async (url, options = {}) => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  return { status: response.status, body: await response.json() };
};

const login = async () => {
  const response = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'manager@stocksense.app', password: 'Demo123!' }) });
  assert.equal(response.status, 200);
  return response.body.data.token;
};

const createAndValidate = async (type, body, token) => {
  const created = await request(`/api/${type}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
  assert.equal(created.status, 201, created.body.error?.message);
  const validated = await request(`/api/${type}/${created.body.data.id}/validate`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
  assert.equal(validated.status, 200, validated.body.error?.message);
  return validated.body.data;
};

test.before(async () => {
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.beforeEach(() => store.reset(store.seedState()));

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test('protects inventory data and accepts the demo manager session', async () => {
  const unauthenticated = await request('/api/dashboard');
  assert.equal(unauthenticated.status, 401);
  const malformedToken = await request('/api/dashboard', { headers: { Authorization: 'Bearer not-a-token' } });
  assert.equal(malformedToken.status, 401);
  const token = await login();
  const dashboard = await request('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.kpis.totalUnitsOnHand, 120);
});

test('allows a verified reset token to be used only once', async () => {
  const resetStart = await request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'manager@stocksense.app' }) });
  assert.equal(resetStart.status, 200);
  const verification = await request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: 'manager@stocksense.app', otp: resetStart.body.data.developmentOtp }) });
  assert.equal(verification.status, 200);
  const resetToken = verification.body.data.resetToken;

  const reset = await request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, password: 'Changed123!' }) });
  assert.equal(reset.status, 200);
  const retry = await request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, password: 'Another123!' }) });
  assert.equal(retry.status, 401);
});

test('runs a complete receipt, transfer, delivery, and adjustment lifecycle with a traceable ledger', async () => {
  const token = await login();
  const receipt = await createAndValidate('receipts', { supplier: 'Apex Metals', destinationLocationId: 'loc_main_store', lines: [{ productId: 'prd_steel', quantity: 50 }] }, token);
  assert.equal(receipt.status, 'done');

  const transfer = await createAndValidate('transfers', { sourceLocationId: 'loc_main_store', destinationLocationId: 'loc_production_rack', lines: [{ productId: 'prd_steel', quantity: 10 }] }, token);
  assert.equal(transfer.status, 'done');

  const delivery = await createAndValidate('deliveries', { customer: 'Northwind', sourceLocationId: 'loc_production_rack', lines: [{ productId: 'prd_steel', quantity: 20 }] }, token);
  assert.equal(delivery.status, 'done');

  const adjustment = await createAndValidate('adjustments', { locationId: 'loc_production_rack', lines: [{ productId: 'prd_steel', physicalQuantity: 5 }] }, token);
  assert.equal(adjustment.status, 'done');

  const stock = await request('/api/stock?productId=prd_steel', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(stock.status, 200);
  assert.equal(stock.body.data.reduce((total, entry) => total + entry.quantity, 0), 145);

  const ledger = await request('/api/ledger?productId=prd_steel', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(ledger.status, 200);
  assert.deepEqual(new Set(ledger.body.data.map((entry) => entry.operationType)), new Set(['initial', 'receipt', 'transfer', 'delivery', 'adjustment']));

  const dashboard = await request('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(dashboard.body.data.kpis.totalUnitsOnHand, 145);
});

test('rejects a delivery when its source location does not have enough stock', async () => {
  const token = await login();
  const delivery = await request('/api/deliveries', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ customer: 'Northwind', sourceLocationId: 'loc_production_rack', lines: [{ productId: 'prd_steel', quantity: 21 }] }) });
  assert.equal(delivery.status, 201);
  const validation = await request(`/api/deliveries/${delivery.body.data.id}/validate`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
  assert.equal(validation.status, 409);
  assert.equal(validation.body.error.code, 'INSUFFICIENT_STOCK');
});
