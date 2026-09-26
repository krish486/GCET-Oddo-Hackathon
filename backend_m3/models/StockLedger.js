/**
 * PLACEHOLDER MODEL — coordinate with whoever owns the ledger feature.
 * Every stock-changing operation (receipt validate, delivery validate,
 * transfer validate, adjustment apply) writes one row per product here.
 * This is what powers the "Move History" / Stock Ledger screen.
 */
const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    quantityChange: { type: Number, required: true }, // positive = in, negative = out
    balanceAfter: { type: Number, required: true },
    operationType: {
      type: String,
      enum: ['receipt', 'delivery', 'transfer', 'adjustment'],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    referenceCode: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.StockLedger || mongoose.model('StockLedger', stockLedgerSchema);
