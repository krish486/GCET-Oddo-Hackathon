const warehouse = require('../services/warehouseService');
module.exports = {
  warehouses: () => ({ data: warehouse.listWarehouses() }),
  createWarehouse: ({ body }) => ({ data: warehouse.createWarehouse(body), message: 'Warehouse created.', status: 201 }),
  locations: ({ query }) => ({ data: warehouse.listLocations(query) }),
  createLocation: ({ body }) => ({ data: warehouse.createLocation(body), message: 'Location created.', status: 201 }),
  stock: ({ query }) => ({ data: warehouse.listStock(query) }),
};
