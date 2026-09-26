const store = require('../models/store');
const { DOCUMENT_STATUS } = require('../constants');
function dashboard(query = {}) {
  const state = store.read();
  const locationIds = state.locations.filter((location) => (!query.warehouseId || location.warehouseId === query.warehouseId) && (!query.locationId || location.id === query.locationId)).map((location) => location.id);
  const productMatches = (product) => !query.categoryId || product.categoryId === query.categoryId;
  const stockFor = (productId) => state.stocks.filter((stock) => stock.productId === productId && locationIds.includes(stock.locationId)).reduce((sum, stock) => sum + stock.quantity, 0);
  const productSummaries = state.products.filter(productMatches).map((product) => ({ ...product, totalOnHand: stockFor(product.id) }));
  const operationMatchesScope = (operation) => {
    const operationLocationIds = [operation.sourceLocationId, operation.destinationLocationId, operation.locationId].filter(Boolean);
    const locationMatches = !query.locationId || operationLocationIds.includes(query.locationId);
    const warehouseMatches = !query.warehouseId || operationLocationIds.some((id) => state.locations.find((location) => location.id === id)?.warehouseId === query.warehouseId);
    const categoryMatches = !query.categoryId || operation.lines.some((line) => state.products.find((product) => product.id === line.productId)?.categoryId === query.categoryId);
    return locationMatches && warehouseMatches && categoryMatches;
  };
  const pending = (type) => state.operations.filter((operation) => operation.type === type && operation.status !== DOCUMENT_STATUS.DONE && operation.status !== DOCUMENT_STATUS.CANCELED && (!query.status || operation.status === query.status) && (!query.documentType || query.documentType === operation.type) && operationMatchesScope(operation)).length;
  const alert = productSummaries.filter((product) => product.totalOnHand <= product.reorderLevel).map((product) => ({ productId: product.id, productName: product.name, sku: product.sku, available: product.totalOnHand, reorderLevel: product.reorderLevel, severity: product.totalOnHand === 0 ? 'out_of_stock' : 'low_stock' }));
  const activities = state.ledger.filter((entry) => (!query.documentType || entry.operationType === query.documentType) && (!query.locationId || entry.locationId === query.locationId) && (!query.warehouseId || state.locations.find((location) => location.id === entry.locationId)?.warehouseId === query.warehouseId) && (!query.categoryId || state.products.find((product) => product.id === entry.productId)?.categoryId === query.categoryId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map((entry) => ({ ...entry, product: state.products.find((product) => product.id === entry.productId), location: state.locations.find((location) => location.id === entry.locationId) }));
  return { kpis: { totalProductsInStock: productSummaries.filter((product) => product.totalOnHand > 0).length, totalUnitsOnHand: productSummaries.reduce((sum, product) => sum + product.totalOnHand, 0), lowStock: alert.filter((item) => item.severity === 'low_stock').length, outOfStock: alert.filter((item) => item.severity === 'out_of_stock').length, pendingReceipts: pending('receipt'), pendingDeliveries: pending('delivery'), scheduledTransfers: pending('transfer') }, lowStockAlerts: alert, recentActivity: activities, filters: { warehouses: state.warehouses, locations: state.locations, categories: state.categories } };
}
module.exports = { dashboard };
