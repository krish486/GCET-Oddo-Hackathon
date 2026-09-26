const auth = require('../services/authService');
const { validate } = require('../validators');
const { setSessionCookie, clearSessionCookie } = require('../utils/cookie');
const rateLimiter = require('../utils/rateLimiter');
const { fail } = require('../utils/http');

const execute = (work) => async (ctx) => work(ctx);

/**
 * Rate-limit helper: throws 429 if the key is over the limit.
 * Keyed by IP + route to avoid sharing buckets across endpoints.
 */
function rateLimit(ctx, route, limit, windowMs) {
  const key = `${ctx.ip}:${route}`;
  const result = rateLimiter.check(key, limit, windowMs);
  if (!result.allowed) {
    fail(
      429,
      'RATE_LIMITED',
      `Too many requests. Please wait ${result.resetIn} seconds before trying again.`,
    );
  }
}

const signup = execute(({ body, response }) => {
  validate('signup', body);
  const data = auth.signup(body); // role is always enforced as 'staff' in the service
  setSessionCookie(response, data.token);
  return { data, message: 'Account created.', status: 201 };
});

const login = execute(({ body, response, ip }) => {
  rateLimit({ ip }, 'login', 10, 60_000); // 10 attempts per minute per IP
  validate('login', body);
  const data = auth.login(body);
  // Reset limiter on success
  rateLimiter.reset(`${ip}:login`);
  setSessionCookie(response, data.token);
  return { data, message: 'Signed in successfully.' };
});

const logout = execute(({ token, response }) => {
  if (token) auth.logout(token);
  clearSessionCookie(response);
  return { data: null, message: 'Signed out successfully.' };
});

const forgotPassword = execute(async ({ body, ip }) => {
    rateLimit({ ip }, 'forgot-password', 5, 60_000);

    validate('forgotPassword', body);

    const data = await auth.startPasswordReset(body);

    return {
        data,
        message: 'If that email exists, a verification code has been sent.',
    };
});

const verifyOtp = execute(({ body, ip }) => {
  rateLimit({ ip }, 'verify-otp', 8, 60_000); // 8 attempts per minute per IP
  validate('verifyOtp', body);
  return { data: auth.verifyOtp(body), message: 'Code verified.' };
});

const resetPassword = execute(({ body, response }) => {
  validate('resetPassword', body);
  const data = auth.resetPassword(body);
  // Log the user in immediately after a successful reset
  setSessionCookie(response, data.token);
  return { data, message: 'Password reset successfully.' };
});

const me = execute(({ user }) => ({ data: user }));

const updateProfile = execute(({ user, body }) => ({
  data: auth.updateProfile(user.id, body),
  message: 'Profile updated.',
}));

module.exports = { signup, login, logout, forgotPassword, verifyOtp, resetPassword, me, updateProfile };
