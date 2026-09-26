const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().required(),
  countedQty: Joi.number().min(0).required(),
});

exports.createAdjustmentSchema = Joi.object({
  warehouse: Joi.string().required(),
  location: Joi.string().required(),
  reason: Joi.string().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

exports.updateAdjustmentSchema = Joi.object({
  warehouse: Joi.string(),
  location: Joi.string(),
  reason: Joi.string(),
  items: Joi.array().items(itemSchema).min(1),
});
