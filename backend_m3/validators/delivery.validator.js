const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().required(),
  orderedQty: Joi.number().min(0.0001).required(),
});

exports.createDeliverySchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().required(),
    contact: Joi.string().allow(''),
  }).required(),
  warehouse: Joi.string().required(),
  location: Joi.string().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
  notes: Joi.string().allow(''),
});

exports.updateDeliverySchema = Joi.object({
  customer: Joi.object({
    name: Joi.string(),
    contact: Joi.string().allow(''),
  }),
  warehouse: Joi.string(),
  location: Joi.string(),
  items: Joi.array().items(itemSchema).min(1),
  notes: Joi.string().allow(''),
});
