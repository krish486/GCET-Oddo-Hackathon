const Receipt = require('../models/Receipt');
const AppError = require('../utils/AppError');
const { increaseStock, withTransaction } = require('./stockMutation.service');
const { DRAFT, DONE, CANCELED } = require('../constants/operationStatus');
const { RECEIPT } = require('../constants/operationTypes');

async function generateReceiptNumber() {
  const count = await Receipt.countDocuments();
  return `RCPT-${String(count + 1).padStart(5, '0')}`;
}

async function listReceipts(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.warehouse) query.warehouse = filters.warehouse;
  return Receipt.find(query).sort({ createdAt: -1 }).populate('items.product', 'name sku unit');
}

async function getReceiptById(id) {
  const receipt = await Receipt.findById(id).populate('items.product', 'name sku unit');
  if (!receipt) throw new AppError('Receipt not found', 404);
  return receipt;
}

async function createReceipt(payload, userId) {
  const receiptNumber = await generateReceiptNumber();
  return Receipt.create({
    ...payload,
    receiptNumber,
    status: DRAFT,
    createdBy: userId,
  });
}

async function updateReceipt(id, payload) {
  const receipt = await getReceiptById(id);
  if (receipt.status !== DRAFT) {
    throw new AppError('Only draft receipts can be edited', 400);
  }
  Object.assign(receipt, payload);
  await receipt.save();
  return receipt;
}

/**
 * Validate a receipt: goods have physically arrived, so stock goes UP.
 * This is the step that actually moves inventory — everything before it
 * (create/update) is just paperwork.
 */
async function validateReceipt(id, userId) {
  return withTransaction(async (session) => {
    const receipt = await Receipt.findById(id).session(session);
    if (!receipt) throw new AppError('Receipt not found', 404);
    if (receipt.status === DONE) throw new AppError('Receipt is already validated', 400);
    if (receipt.status === CANCELED) throw new AppError('Cannot validate a canceled receipt', 400);

    for (const item of receipt.items) {
      const qty = item.receivedQty > 0 ? item.receivedQty : item.expectedQty;
      await increaseStock({
        product: item.product,
        location: receipt.location,
        quantity: qty,
        operationType: RECEIPT,
        referenceId: receipt._id,
        referenceCode: receipt.receiptNumber,
        createdBy: userId,
        session,
      });
      item.receivedQty = qty;
    }

    receipt.status = DONE;
    receipt.validatedAt = new Date();
    await receipt.save({ session });
    return receipt;
  });
}

async function cancelReceipt(id) {
  const receipt = await getReceiptById(id);
  if (receipt.status === DONE) throw new AppError('Cannot cancel a validated receipt', 400);
  receipt.status = CANCELED;
  await receipt.save();
  return receipt;
}

module.exports = {
  listReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  validateReceipt,
  cancelReceipt,
};
