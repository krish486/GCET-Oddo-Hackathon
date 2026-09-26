const Transfer = require('../models/Transfer');
const AppError = require('../utils/AppError');
const { increaseStock, decreaseStock, withTransaction } = require('./stockMutation.service');
const { DRAFT, DONE, CANCELED } = require('../constants/operationStatus');
const { TRANSFER } = require('../constants/operationTypes');

async function generateTransferNumber() {
  const count = await Transfer.countDocuments();
  return `TRF-${String(count + 1).padStart(5, '0')}`;
}

async function listTransfers(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  return Transfer.find(query).sort({ createdAt: -1 }).populate('items.product', 'name sku unit');
}

async function getTransferById(id) {
  const transfer = await Transfer.findById(id).populate('items.product', 'name sku unit');
  if (!transfer) throw new AppError('Transfer not found', 404);
  return transfer;
}

async function createTransfer(payload, userId) {
  const transferNumber = await generateTransferNumber();
  return Transfer.create({
    ...payload,
    transferNumber,
    status: DRAFT,
    createdBy: userId,
  });
}

async function updateTransfer(id, payload) {
  const transfer = await getTransferById(id);
  if (transfer.status !== DRAFT) {
    throw new AppError('Only draft transfers can be edited', 400);
  }
  Object.assign(transfer, payload);
  await transfer.save();
  return transfer;
}

/**
 * Validate a transfer: stock leaves the source location and lands in the
 * destination location. Total company-wide stock is unchanged, but the
 * per-location breakdown moves — that's the whole point of a transfer.
 * decreaseStock() is called first so an under-stocked source location
 * fails the transaction before anything is added anywhere.
 */
async function validateTransfer(id, userId) {
  return withTransaction(async (session) => {
    const transfer = await Transfer.findById(id).session(session);
    if (!transfer) throw new AppError('Transfer not found', 404);
    if (transfer.status === DONE) throw new AppError('Transfer is already validated', 400);
    if (transfer.status === CANCELED) throw new AppError('Cannot validate a canceled transfer', 400);

    for (const item of transfer.items) {
      await decreaseStock({
        product: item.product,
        location: transfer.sourceLocation,
        quantity: item.quantity,
        operationType: TRANSFER,
        referenceId: transfer._id,
        referenceCode: transfer.transferNumber,
        createdBy: userId,
        session,
      });

      await increaseStock({
        product: item.product,
        location: transfer.destinationLocation,
        quantity: item.quantity,
        operationType: TRANSFER,
        referenceId: transfer._id,
        referenceCode: transfer.transferNumber,
        createdBy: userId,
        session,
      });
    }

    transfer.status = DONE;
    transfer.validatedAt = new Date();
    await transfer.save({ session });
    return transfer;
  });
}

async function cancelTransfer(id) {
  const transfer = await getTransferById(id);
  if (transfer.status === DONE) throw new AppError('Cannot cancel a validated transfer', 400);
  transfer.status = CANCELED;
  await transfer.save();
  return transfer;
}

module.exports = {
  listTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
  cancelTransfer,
};
