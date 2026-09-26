/**
 * PLACEHOLDER MODEL.
 * Stock (per product, per location quantity) is normally owned by the
 * teammate building Products/Warehouses. This minimal version exists so
 * receipts/deliveries/transfers/adjustments can be developed and tested
 * independently. Swap it out for the real one once it lands on the branch
 * you merge into (keep the field names the same, or update the services).
 */
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

stockSchema.index({ product: 1, location: 1 }, { unique: true });

module.exports = mongoose.models.Stock || mongoose.model('Stock', stockSchema);
