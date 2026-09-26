const authService = require('../services/authService');
const { fail } = require('../utils/http');
function authenticate(context) {
  const value = context.headers.authorization || '';
  if (!value.startsWith('Bearer ')) fail(401, 'AUTH_REQUIRED', 'Sign in to access this resource.');
  const { user, claims } = authService.authenticate(value.slice(7));
  context.user = user; context.token = value.slice(7); context.claims = claims;
}
function authorize(context, roles) { if (roles?.length && !roles.includes(context.user.role)) fail(403, 'FORBIDDEN', 'Your role does not have permission to perform this action.'); }
module.exports = { authenticate, authorize };
