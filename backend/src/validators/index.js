const { fail } = require('../utils/http');
const requireFields = (body, fields) => fields.forEach((field) => { if (body[field] === undefined || body[field] === null || body[field] === '') fail(422, 'VALIDATION_ERROR', `${field} is required.`, { field }); });
const validate = (name, body) => {
  const fields = { signup: ['name', 'email', 'password'], login: ['email', 'password'], forgotPassword: ['email'], verifyOtp: ['email', 'otp'], resetPassword: ['resetToken', 'password'] };
  if (fields[name]) requireFields(body, fields[name]);
};
module.exports = { validate, requireFields };
