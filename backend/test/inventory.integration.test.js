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
  const cookie = response.headers.get('set-cookie');
  return {
    status: response.status,
    headers: response.headers,
    cookie,
    body: await response.json().catch(() => ({})),
  };
};

const loginManager = async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'manager@stocksense.app', password: 'Demo123!' }),
  });
  assert.equal(response.status, 200);
  assert.ok(response.cookie && response.cookie.includes('stocksense_session='));
  return { token: response.body.data.token, cookie: response.cookie.split(';')[0] };
};

const createAndValidate = async (type, body, authHeaders) => {
  const headers = typeof authHeaders === 'string' ? { Authorization: `Bearer ${authHeaders}` } : authHeaders;
  const created = await request(`/api/${type}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  assert.equal(created.status, 201, created.body.error?.message);
  const docId = created.body.data.id;

  if (type === 'deliveries') {
    // Delivery flow: draft -> pick -> waiting -> pack -> ready -> validate -> done
    const picked = await request(`/api/deliveries/${docId}/pick`, { method: 'PATCH', headers });
    assert.equal(picked.status, 200, picked.body.error?.message);
    assert.equal(picked.body.data.status, 'waiting');

    const packed = await request(`/api/deliveries/${docId}/pack`, { method: 'PATCH', headers });
    assert.equal(packed.status, 200, packed.body.error?.message);
    assert.equal(packed.body.data.status, 'ready');
  }

  const validated = await request(`/api/${type}/${docId}/validate`, { method: 'PATCH', headers });
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
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test('protects inventory data and accepts cookie-based authenticated session', async () => {
  const unauthenticated = await request('/api/dashboard');
  assert.equal(unauthenticated.status, 401);

  const malformedCookie = await request('/api/dashboard', { headers: { Cookie: 'stocksense_session=invalid' } });
  assert.equal(malformedCookie.status, 401);

  const { cookie } = await loginManager();
  const dashboard = await request('/api/dashboard', { headers: { Cookie: cookie } });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.kpis.totalUnitsOnHand, 120);
});

test('public signup always creates staff role even if manager role is requested', async () => {
  const signupRes = await request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      name: 'New Staff',
      email: 'staff@stocksense.app',
      password: 'Password123!',
      role: 'manager', // trying to escalate privilege
    }),
  });
  assert.equal(signupRes.status, 201);
  assert.equal(signupRes.body.data.user.role, 'staff');

  const staffCookie = signupRes.cookie.split(';')[0];

  // Staff should be forbidden from creating products or warehouses
  const productCreate = await request('/api/products', {
    method: 'POST',
    headers: { Cookie: staffCookie },
    body: JSON.stringify({
      name: 'Unauthorized Product',
      sku: 'NOPE-001',
      categoryId: 'cat_metals',
      unit: 'pcs',
      reorderLevel: 10,
    }),
  });
  assert.equal(productCreate.status, 403);
  assert.equal(productCreate.body.error.code, 'FORBIDDEN');
});

test('allows a verified reset token to be used only once', async () => {
  const resetStart = await request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'manager@stocksense.app' }),
  });
  assert.equal(resetStart.status, 200);
  const verification = await request('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      email: 'manager@stocksense.app',
      otp: resetStart.body.data.developmentOtp,
    }),
  });
  assert.equal(verification.status, 200);
  const resetToken = verification.body.data.resetToken;

  const reset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, password: 'Changed123!' }),
  });
  assert.equal(reset.status, 200);

  const retry = await request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, password: 'Another123!' }),
  });
  assert.equal(retry.status, 401);
});

test('runs a complete receipt, transfer, delivery, and adjustment lifecycle with a traceable ledger', async () => {
  const { cookie } = await loginManager();
  const headers = { Cookie: cookie };

  // 1. Receipt: +50 to main store (100 -> 150)
  const receipt = await createAndValidate(
    'receipts',
    {
      supplier: 'Apex Metals',
      destinationLocationId: 'loc_main_store',
      lines: [{ productId: 'prd_steel', quantity: 50 }],
    },
    headers,
  );
  assert.equal(receipt.status, 'done');

  // 2. Transfer: 10 from main store to production rack (main: 150 -> 140, rack: 20 -> 30)
  const transfer = await createAndValidate(
    'transfers',
    {
      sourceLocationId: 'loc_main_store',
      destinationLocationId: 'loc_production_rack',
      lines: [{ productId: 'prd_steel', quantity: 10 }],
    },
    headers,
  );
  assert.equal(transfer.status, 'done');

  // 3. Delivery: 20 from production rack (rack: 30 -> 10)
  const delivery = await createAndValidate(
    'deliveries',
    {
      customer: 'Northwind',
      sourceLocationId: 'loc_production_rack',
      lines: [{ productId: 'prd_steel', quantity: 20 }],
    },
    headers,
  );
  assert.equal(delivery.status, 'done');

  // 4. Adjustment: set physical quantity to 5 on rack (rack: 10 -> 5)
  const adjustment = await createAndValidate(
    'adjustments',
    {
      locationId: 'loc_production_rack',
      lines: [{ productId: 'prd_steel', physicalQuantity: 5 }],
    },
    headers,
  );
  assert.equal(adjustment.status, 'done');

  // Total stock should now be main(140) + rack(5) = 145
  const stock = await request('/api/stock?productId=prd_steel', { headers });
  assert.equal(stock.status, 200);
  assert.equal(
    stock.body.data.reduce((total, entry) => total + entry.quantity, 0),
    145,
  );

  const ledger = await request('/api/ledger?productId=prd_steel', { headers });
  assert.equal(ledger.status, 200);
  assert.deepEqual(
    new Set(ledger.body.data.map((entry) => entry.operationType)),
    new Set(['initial', 'receipt', 'transfer', 'delivery', 'adjustment']),
  );

  const dashboard = await request('/api/dashboard', { headers });
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.data.kpis.totalUnitsOnHand, 145);
});

test('enforces strict delivery workflow states and rejects invalid transitions', async () => {
  const { cookie } = await loginManager();
  const headers = { Cookie: cookie };

  const deliveryRes = await request('/api/deliveries', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: 'Acme Corp',
      sourceLocationId: 'loc_production_rack',
      lines: [{ productId: 'prd_steel', quantity: 5 }],
    }),
  });
  assert.equal(deliveryRes.status, 201);
  const docId = deliveryRes.body.data.id;
  assert.equal(deliveryRes.body.data.status, 'draft');

  // Cannot validate directly from draft
  const earlyValidate = await request(`/api/deliveries/${docId}/validate`, { method: 'PATCH', headers });
  assert.equal(earlyValidate.status, 409);
  assert.equal(earlyValidate.body.error.code, 'INVALID_STATUS_CHANGE');

  // Cannot pack from draft
  const earlyPack = await request(`/api/deliveries/${docId}/pack`, { method: 'PATCH', headers });
  assert.equal(earlyPack.status, 409);

  // Must pick first
  const pick = await request(`/api/deliveries/${docId}/pick`, { method: 'PATCH', headers });
  assert.equal(pick.status, 200);
  assert.equal(pick.body.data.status, 'waiting');

  // Cannot validate from waiting (must pack first)
  const waitingValidate = await request(`/api/deliveries/${docId}/validate`, { method: 'PATCH', headers });
  assert.equal(waitingValidate.status, 409);

  // Pack next
  const pack = await request(`/api/deliveries/${docId}/pack`, { method: 'PATCH', headers });
  assert.equal(pack.status, 200);
  assert.equal(pack.body.data.status, 'ready');

  // Validate now succeeds
  const validate = await request(`/api/deliveries/${docId}/validate`, { method: 'PATCH', headers });
  assert.equal(validate.status, 200);
  assert.equal(validate.body.data.status, 'done');
});

test('rejects a delivery when its source location does not have enough stock', async () => {
  const { cookie } = await loginManager();
  const headers = { Cookie: cookie };

  const delivery = await request('/api/deliveries', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer: 'Northwind',
      sourceLocationId: 'loc_production_rack', // rack has 20 in seed
      lines: [{ productId: 'prd_steel', quantity: 21 }],
    }),
  });
  assert.equal(delivery.status, 201);
  const docId = delivery.body.data.id;

  await request(`/api/deliveries/${docId}/pick`, { method: 'PATCH', headers });
  await request(`/api/deliveries/${docId}/pack`, { method: 'PATCH', headers });

  const validation = await request(`/api/deliveries/${docId}/validate`, { method: 'PATCH', headers });
  assert.equal(validation.status, 409);
  assert.equal(validation.body.error.code, 'INSUFFICIENT_STOCK');
});

test('enforces unique constraints on SKU, warehouse code, and location code', async () => {
  const { cookie } = await loginManager();
  const headers = { Cookie: cookie };

  // Duplicate SKU
  const duplicateSku = await request('/api/products', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Duplicate Steel',
      sku: 'STL-001', // Already exists in seed
      categoryId: 'cat_metals',
      unit: 'kg',
      reorderLevel: 10,
    }),
  });
  assert.equal(duplicateSku.status, 409);
  assert.equal(duplicateSku.body.error.code, 'DUPLICATE_SKU');

  // Duplicate Warehouse code
  const duplicateWh = await request('/api/warehouses', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Second Main',
      code: 'MAIN', // Already exists in seed
    }),
  });
  assert.equal(duplicateWh.status, 409);
  assert.equal(duplicateWh.body.error.code, 'DUPLICATE_WAREHOUSE_CODE');

  // Duplicate Location code
  const duplicateLoc = await request('/api/locations', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      warehouseId: 'wh_main',
      name: 'Duplicate Rack',
      code: 'PROD-R1', // Already exists in seed
    }),
  });
  assert.equal(duplicateLoc.status, 409);
  assert.equal(duplicateLoc.body.error.code, 'DUPLICATE_LOCATION_CODE');
});

test('logout revokes session and clears authentication cookie', async () => {
  const { cookie } = await loginManager();
  const headers = { Cookie: cookie };

  const meBefore = await request('/api/auth/me', { headers });
  assert.equal(meBefore.status, 200);

  const logoutRes = await request('/api/auth/logout', { method: 'POST', headers });
  assert.equal(logoutRes.status, 200);
  assert.ok(logoutRes.cookie && logoutRes.cookie.includes('Max-Age=0'));

  const meAfter = await request('/api/auth/me', { headers });
  assert.equal(meAfter.status, 401);
});
