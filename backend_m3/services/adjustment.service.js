const Adjustment = require('../models/Adjustment');
const AppError = require('../utils/AppError');
const { setStock, getAvailableQuantity, withTransaction } = require('./stockMutation.service');
const { DRAFT, DONE, CANCELED } = require('../constants/operationStatus');
const { ADJUSTMENT } = require('../constants/operationTypes');

async function generateAdjustmentNumber() {
  const count = await Adjustment.countDocuments();
  return `ADJ-${String(count + 1).padStart(5, '0')}`;
}

async function listAdjustments(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  return Adjustment.find(query).sort({ createdAt: -1 }).populate('items.product', 'name sku unit');
}

async function getAdjustmentById(id) {
  const adjustment = await Adjustment.findById(id).populate('items.product', 'name sku unit');
  if (!adjustment) throw new AppError('Adjustment not found', 404);
  return adjustment;
}

/**
 * Creating an adjustment snapshots the *current system quantity* for each
 * product/location line, so staff are always comparing the physical count
 * against what the system said at the moment they started counting.
 */
async function createAdjustment(payload, userId) {
  const adjustmentNumber = await generateAdjustmentNumber();

  const items = await Promise.all(
    payload.items.map(async (item) => {
      const systemQty = await getAvailableQuantity(item.product, payload.location);
      return {
        product: item.product,
        systemQty,
        countedQty: item.countedQty,
        difference: item.countedQty - systemQty,
      };
    })
  );

  return Adjustment.create({
    ...payload,
    items,
    adjustmentNumber,
    status: DRAFT,
    createdBy: userId,
  });
}

async function updateAdjustment(id, payload) {
  const adjustment = await getAdjustmentById(id);
  if (adjustment.status !== DRAFT) {
    throw new AppError('Only draft adjustments can be edited', 400);
  }
  Object.assign(adjustment, payload);
  await adjustment.save();
  return adjustment;
}

/**
 * Validate an adjustment: system quantity is forced to match what staff
 * physically counted. Recomputes the difference against the live stock
 * value at the moment of validation (in case something else moved stock
 * in between), not the stale snapshot taken at creation time.
 */
async function validateAdjustment(id, userId) {
  return withTransaction(async (session) => {
    const adjustment = await Adjustment.findById(id).session(session);
    if (!adjustment) throw new AppError('Adjustment not found', 404);
    if (adjustment.status === DONE) throw new AppError('Adjustment is already validated', 400);
    if (adjustment.status === CANCELED) throw new AppError('Cannot validate a canceled adjustment', 400);

    for (const item of adjustment.items) {
      const { difference } = await setStock({
        product: item.product,
        location: adjustment.location,
        countedQuantity: item.countedQty,
        operationType: ADJUSTMENT,
        referenceId: adjustment._id,
        referenceCode: adjustment.adjustmentNumber,
        createdBy: userId,
        session,
      });
      item.difference = difference;
    }

    adjustment.status = DONE;
    adjustment.validatedAt = new Date();
    await adjustment.save({ session });
    return adjustment;
  });
}

async function cancelAdjustment(id) {
  const adjustment = await getAdjustmentById(id);
  if (adjustment.status === DONE) throw new AppError('Cannot cancel a validated adjustment', 400);
  adjustment.status = CANCELED;
  await adjustment.save();
  return adjustment;
}

module.exports = {
  listAdjustments,
  getAdjustmentById,
  createAdjustment,
  updateAdjustment,
  validateAdjustment,
  cancelAdjustment,
};
