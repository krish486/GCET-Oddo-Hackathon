/**
 * PLACEHOLDER — this file is normally owned by whoever sets up shared
 * middleware. Kept minimal here so receipt/delivery/transfer/adjustment
 * routes can be developed standalone. Validates req.body against a Joi
 * schema and returns a clean 400 with all field errors if it fails.
 */
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  next();
};

module.exports = validate;
