/**
 * stockMutation.service.js
 * -------------------------------------------------------------
 * Single shared place where "stock actually changes". Every operation
 * service (receipt, delivery, transfer, adjustment) calls into this
 * instead of touching the Stock/StockLedger models directly.
 *
 * Keeping it in one file means:
 *  - there's exactly one place that writes to Stock + StockLedger together
 *  - it's easy to review for correctness (this is the "money code")
 *  - every operation gets the same guarantees (atomic, always logged)
 */
const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const StockLedger = require('../models/StockLedger');
const AppError = require('../utils/AppError');

/**
 * Increase stock of a product at a location (used by Receipts, and the
 * "destination" side of a Transfer). Creates the Stock row if missing.
 */
async function increaseStock({ product, location, quantity, operationType, referenceId, referenceCode, createdBy, session }) {
  if (quantity <= 0) throw new AppError('Quantity to add must be greater than 0', 400);

  const stock = await Stock.findOneAndUpdate(
    { product, location },
    { $inc: { quantity } },
    { upsert: true, new: true, session }
  );

  await StockLedger.create(
    [
      {
        product,
        location,
        quantityChange: quantity,
        balanceAfter: stock.quantity,
        operationType,
        referenceId,
        referenceCode,
        createdBy,
      },
    ],
    { session }
  );

  return stock;
}

/**
 * Decrease stock of a product at a location (used by Deliveries, and the
 * "source" side of a Transfer). Throws if there isn't enough stock —
 * callers should validate availability first with hasSufficientStock().
 */
async function decreaseStock({ product, location, quantity, operationType, referenceId, referenceCode, createdBy, session }) {
  if (quantity <= 0) throw new AppError('Quantity to remove must be greater than 0', 400);

  // Atomic guard: only decrement if enough stock exists, so two concurrent
  // deliveries can't both succeed and push quantity negative.
  const stock = await Stock.findOneAndUpdate(
    { product, location, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity } },
    { new: true, session }
  );

  if (!stock) {
    throw new AppError('Not enough stock at this location to complete the operation', 409);
  }

  await StockLedger.create(
    [
      {
        product,
        location,
        quantityChange: -quantity,
        balanceAfter: stock.quantity,
        operationType,
        referenceId,
        referenceCode,
        createdBy,
      },
    ],
    { session }
  );

  return stock;
}

/**
 * Set stock to an exact counted value (used by Adjustments). Logs the
 * signed difference so the ledger still reads as a delta, not a reset.
 */
async function setStock({ product, location, countedQuantity, operationType, referenceId, referenceCode, createdBy, session }) {
  if (countedQuantity < 0) throw new AppError('Counted quantity cannot be negative', 400);

  const existing = await Stock.findOne({ product, location }).session(session);
  const previousQuantity = existing ? existing.quantity : 0;
  const difference = countedQuantity - previousQuantity;

  const stock = await Stock.findOneAndUpdate(
    { product, location },
    { $set: { quantity: countedQuantity } },
    { upsert: true, new: true, session }
  );

  if (difference !== 0) {
    await StockLedger.create(
      [
        {
          product,
          location,
          quantityChange: difference,
          balanceAfter: stock.quantity,
          operationType,
          referenceId,
          referenceCode,
          createdBy,
        },
      ],
      { session }
    );
  }

  return { stock, difference };
}

async function getAvailableQuantity(product, location, session) {
  const stock = await Stock.findOne({ product, location }).session(session);
  return stock ? stock.quantity : 0;
}

/** Run a callback inside a Mongo transaction, retrying is left to the caller. */
async function withTransaction(callback) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    session.endSession();
  }
}

module.exports = {
  increaseStock,
  decreaseStock,
  setStock,
  getAvailableQuantity,
  withTransaction,
};
