const mongoose = require('mongoose');
const { DRAFT, WAITING, READY, DONE, CANCELED } = require('../constants/operationStatus');

const receiptItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    expectedQty: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: { type: String, required: true, unique: true }, // e.g. RCPT-00001
    supplier: {
      name: { type: String, required: true },
      contact: { type: String },
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    items: {
      type: [receiptItemSchema],
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    status: {
      type: String,
      enum: [DRAFT, WAITING, READY, DONE, CANCELED],
      default: DRAFT,
    },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
