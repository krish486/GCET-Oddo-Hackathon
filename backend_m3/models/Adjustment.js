const mongoose = require('mongoose');
const { DRAFT, WAITING, READY, DONE, CANCELED } = require('../constants/operationStatus');

const adjustmentItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    systemQty: { type: Number, required: true, min: 0 }, // snapshot taken when the count was entered
    countedQty: { type: Number, required: true, min: 0 },
    difference: { type: Number, required: true }, // countedQty - systemQty, filled in by the service
  },
  { _id: false }
);

const adjustmentSchema = new mongoose.Schema(
  {
    adjustmentNumber: { type: String, required: true, unique: true }, // e.g. ADJ-00001
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    items: {
      type: [adjustmentItemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    reason: { type: String, required: true }, // e.g. "Damaged goods", "Cycle count"
    status: {
      type: String,
      enum: [DRAFT, WAITING, READY, DONE, CANCELED],
      default: DRAFT,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Adjustment', adjustmentSchema);
