const Joi = require('joi');

const itemSchema = Joi.object({
  product: Joi.string().required(),
  quantity: Joi.number().min(0.0001).required(),
});

exports.createTransferSchema = Joi.object({
  sourceWarehouse: Joi.string().required(),
  sourceLocation: Joi.string().required(),
  destinationWarehouse: Joi.string().required(),
  destinationLocation: Joi.string().required(),
  items: Joi.array().items(itemSchema).min(1).required(),
  notes: Joi.string().allow(''),
}).custom((value, helpers) => {
  if (value.sourceLocation === value.destinationLocation) {
    return helpers.error('any.invalid', { message: 'Source and destination location must differ' });
  }
  return value;
});

exports.updateTransferSchema = Joi.object({
  sourceWarehouse: Joi.string(),
  sourceLocation: Joi.string(),
  destinationWarehouse: Joi.string(),
  destinationLocation: Joi.string(),
  items: Joi.array().items(itemSchema).min(1),
  notes: Joi.string().allow(''),
});
