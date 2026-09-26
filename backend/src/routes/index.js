const auth = require('../controllers/authController');
const catalog = require('../controllers/catalogController');
const warehouse = require('../controllers/warehouseController');
const operation = require('../controllers/operationController');
const insight = require('../controllers/dashboardController');
const { ROLES } = require('../constants');

const protectedRoute = (method, path, handler, roles) => ({ method, path, handler, auth: true, roles });
const opRoutes = (name, controller) => [
  protectedRoute('GET', `/api/${name}`, controller.list), protectedRoute('GET', `/api/${name}/:id`, controller.get), protectedRoute('POST', `/api/${name}`, controller.create), protectedRoute('PATCH', `/api/${name}/:id/validate`, controller.validate), protectedRoute('PATCH', `/api/${name}/:id/pick`, controller.pick), protectedRoute('PATCH', `/api/${name}/:id/pack`, controller.pack), protectedRoute('PATCH', `/api/${name}/:id/cancel`, controller.cancel),
];
module.exports = [
  { method: 'POST', path: '/api/auth/signup', handler: auth.signup }, { method: 'POST', path: '/api/auth/login', handler: auth.login }, { method: 'POST', path: '/api/auth/forgot-password', handler: auth.forgotPassword }, { method: 'POST', path: '/api/auth/verify-otp', handler: auth.verifyOtp }, { method: 'POST', path: '/api/auth/reset-password', handler: auth.resetPassword },
  protectedRoute('POST', '/api/auth/logout', auth.logout), protectedRoute('GET', '/api/auth/me', auth.me), protectedRoute('PATCH', '/api/profile', auth.updateProfile),
  protectedRoute('GET', '/api/categories', catalog.categories), protectedRoute('POST', '/api/categories', catalog.createCategory, [ROLES.MANAGER]),
  protectedRoute('GET', '/api/products', catalog.products), protectedRoute('GET', '/api/products/:id', catalog.product), protectedRoute('POST', '/api/products', catalog.createProduct, [ROLES.MANAGER]), protectedRoute('PATCH', '/api/products/:id', catalog.updateProduct, [ROLES.MANAGER]),
  protectedRoute('GET', '/api/warehouses', warehouse.warehouses), protectedRoute('POST', '/api/warehouses', warehouse.createWarehouse, [ROLES.MANAGER]), protectedRoute('GET', '/api/locations', warehouse.locations), protectedRoute('POST', '/api/locations', warehouse.createLocation, [ROLES.MANAGER]), protectedRoute('GET', '/api/stock', warehouse.stock),
  ...opRoutes('receipts', operation.receipt), ...opRoutes('deliveries', operation.delivery), ...opRoutes('transfers', operation.transfer), ...opRoutes('adjustments', operation.adjustment),
  protectedRoute('GET', '/api/ledger', insight.ledger), protectedRoute('GET', '/api/dashboard', insight.dashboard),
];
