const mongoose = require('mongoose');
const { DRAFT, WAITING, READY, DONE, CANCELED } = require('../constants/operationStatus');

const transferItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    transferNumber: { type: String, required: true, unique: true }, // e.g. TRF-00001
    sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    sourceLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    items: {
      type: [transferItemSchema],
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

transferSchema.pre('validate', function (next) {
  if (
    this.sourceLocation &&
    this.destinationLocation &&
    this.sourceLocation.toString() === this.destinationLocation.toString()
  ) {
    return next(new Error('Source and destination location cannot be the same'));
  }
  next();
});

module.exports = mongoose.model('Transfer', transferSchema);
