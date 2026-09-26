const mongoose = require('mongoose');
const { DRAFT, WAITING, READY, DONE, CANCELED } = require('../constants/operationStatus');

const deliveryItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    orderedQty: { type: Number, required: true, min: 0 },
    deliveredQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const deliverySchema = new mongoose.Schema(
  {
    deliveryNumber: { type: String, required: true, unique: true }, // e.g. DEL-00001
    customer: {
      name: { type: String, required: true },
      contact: { type: String },
    },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    items: {
      type: [deliveryItemSchema],
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

module.exports = mongoose.model('Delivery', deliverySchema);
