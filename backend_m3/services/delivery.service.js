const Delivery = require('../models/Delivery');
const AppError = require('../utils/AppError');
const { decreaseStock, getAvailableQuantity, withTransaction } = require('./stockMutation.service');
const { DRAFT, DONE, CANCELED } = require('../constants/operationStatus');
const { DELIVERY } = require('../constants/operationTypes');

async function generateDeliveryNumber() {
  const count = await Delivery.countDocuments();
  return `DEL-${String(count + 1).padStart(5, '0')}`;
}

async function listDeliveries(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.warehouse) query.warehouse = filters.warehouse;
  return Delivery.find(query).sort({ createdAt: -1 }).populate('items.product', 'name sku unit');
}

async function getDeliveryById(id) {
  const delivery = await Delivery.findById(id).populate('items.product', 'name sku unit');
  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
}

async function createDelivery(payload, userId) {
  const deliveryNumber = await generateDeliveryNumber();
  return Delivery.create({
    ...payload,
    deliveryNumber,
    status: DRAFT,
    createdBy: userId,
  });
}

async function updateDelivery(id, payload) {
  const delivery = await getDeliveryById(id);
  if (delivery.status !== DRAFT) {
    throw new AppError('Only draft deliveries can be edited', 400);
  }
  Object.assign(delivery, payload);
  await delivery.save();
  return delivery;
}

/**
 * Check every line has enough stock before we let the UI mark a delivery
 * "Ready". Doesn't change anything — just a read-only availability check.
 */
async function checkAvailability(id) {
  const delivery = await getDeliveryById(id);
  const results = [];
  for (const item of delivery.items) {
    const available = await getAvailableQuantity(item.product._id || item.product, delivery.location);
    results.push({
      product: item.product,
      requested: item.orderedQty,
      available,
      sufficient: available >= item.orderedQty,
    });
  }
  return results;
}

/**
 * Validate a delivery: goods are picked, packed and leave the warehouse,
 * so stock goes DOWN. Fails the whole operation (atomically) if any line
 * doesn't have enough stock.
 */
async function validateDelivery(id, userId) {
  return withTransaction(async (session) => {
    const delivery = await Delivery.findById(id).session(session);
    if (!delivery) throw new AppError('Delivery not found', 404);
    if (delivery.status === DONE) throw new AppError('Delivery is already validated', 400);
    if (delivery.status === CANCELED) throw new AppError('Cannot validate a canceled delivery', 400);

    for (const item of delivery.items) {
      await decreaseStock({
        product: item.product,
        location: delivery.location,
        quantity: item.orderedQty,
        operationType: DELIVERY,
        referenceId: delivery._id,
        referenceCode: delivery.deliveryNumber,
        createdBy: userId,
        session,
      });
      item.deliveredQty = item.orderedQty;
    }

    delivery.status = DONE;
    delivery.validatedAt = new Date();
    await delivery.save({ session });
    return delivery;
  });
}

async function cancelDelivery(id) {
  const delivery = await getDeliveryById(id);
  if (delivery.status === DONE) throw new AppError('Cannot cancel a validated delivery', 400);
  delivery.status = CANCELED;
  await delivery.save();
  return delivery;
}

module.exports = {
  listDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  checkAvailability,
  validateDelivery,
  cancelDelivery,
};
