const authService = require('../services/authService');
const { fail } = require('../utils/http');
const { getSessionToken } = require('../utils/cookie');

function authenticate(context) {
  const token = getSessionToken(context);
  if (!token) fail(401, 'AUTH_REQUIRED', 'Sign in to access this resource.');
  const { user, claims } = authService.authenticate(token);
  context.user = user;
  context.token = token;
  context.claims = claims;
}

function authorize(context, roles) {
  if (roles?.length && !roles.includes(context.user.role)) {
    fail(403, 'FORBIDDEN', 'Your role does not have permission to perform this action.');
  }
}

module.exports = { authenticate, authorize };
