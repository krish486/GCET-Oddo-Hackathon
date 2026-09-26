const store = require('../models/store');
const { fail } = require('../utils/http');
const {
    hashPassword,
    verifyPassword,
    issueToken,
    readToken,
    otp,
    hashValue,
} = require('../utils/security');
const { ROLES } = require('../constants');
const { sendPasswordResetOtp } = require('../utils/mailer');

const emailOf = (email) => String(email || '').trim().toLowerCase();
const publicUser = ({ passwordHash, ...user }) => user;
const validatePassword = (password) => { if (typeof password !== 'string' || password.length < 8) fail(422, 'INVALID_PASSWORD', 'Password must be at least 8 characters long.'); };
const tokenFor = (user) => issueToken({ sub: user.id, role: user.role, type: 'access' });

function signup({ name, email, password }) {
  const normalized = emailOf(email);

  if (!String(name || '').trim()) {
    fail(422, 'INVALID_NAME', 'Name is required.');
  }

  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    fail(422, 'INVALID_EMAIL', 'Enter a valid email address.');
  }

  validatePassword(password);

  return store.transaction((state) => {
    if (state.users.some((user) => user.email === normalized)) {
      fail(
        409,
        'EMAIL_IN_USE',
        'An account already uses this email address.'
      );
    }

    const timestamp = new Date().toISOString();

    // Public signup can ONLY create staff accounts.
    const user = {
      id: store.id('usr'),
      name: name.trim(),
      email: normalized,
      passwordHash: hashPassword(password),
      role: ROLES.STAFF,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.users.push(user);

    return {
      user: publicUser(user),
      token: tokenFor(user),
    };
  });
}
function login({ email, password }) {
  const user = store.read().users.find((item) => item.email === emailOf(email));
  if (!user || !verifyPassword(password, user.passwordHash)) fail(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  return { user: publicUser(user), token: tokenFor(user) };
}
function authenticate(token) {
  const claims = readToken(token);
  if (claims.type !== 'access') fail(401, 'INVALID_TOKEN', 'Your session is invalid.');
  const state = store.read();
  if (state.revokedTokens.some((record) => record.jti === claims.jti)) fail(401, 'TOKEN_REVOKED', 'Your session has ended. Please sign in again.');
  const user = state.users.find((item) => item.id === claims.sub);
  if (!user) fail(401, 'INVALID_TOKEN', 'Your account is no longer available.');
  return { user: publicUser(user), claims };
}
function logout(token) { const claims = readToken(token); store.transaction((state) => state.revokedTokens.push({ jti: claims.jti, expiresAt: claims.exp })); }
async function startPasswordReset({ email }) {
    const normalized = emailOf(email);

    const user = store
        .read()
        .users
        .find((item) => item.email === normalized);

    // Do not reveal whether an email exists.
    if (!user) {
        return { sent: true };
    }

    const code = otp();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save the hashed OTP before sending the email.
    store.transaction((state) => {
        state.passwordResets = state.passwordResets.filter(
            (item) => item.email !== normalized,
        );

        state.passwordResets.push({
            email: normalized,
            otpHash: hashValue(code),
            expiresAt,
            verified: false,
        });
    });

    try {
        await sendPasswordResetOtp({
            to: normalized,
            otp: code,
        });
    } catch (error) {
        // Do not leave a usable reset code if email delivery failed.
        store.transaction((state) => {
            state.passwordResets = state.passwordResets.filter(
                (item) => item.email !== normalized,
            );
        });

        console.error('Password reset email failed:', error);

        fail(
            500,
            'EMAIL_SEND_FAILED',
            'We could not send the verification email. Please try again later.',
        );
    }

    return {
        sent: true,
    };
}
function verifyOtp({ email, otp: code }) {
  const normalized = emailOf(email); const reset = store.read().passwordResets.find((item) => item.email === normalized);
  if (!reset || reset.expiresAt < Date.now() || reset.otpHash !== hashValue(code)) fail(422, 'INVALID_OTP', 'That verification code is invalid or has expired.');
  return store.transaction((state) => {
    const found = state.passwordResets.find((item) => item.email === normalized);
    const user = state.users.find((item) => item.email === normalized);
    const resetNonce = require('node:crypto').randomUUID();
    found.verified = true;
    found.resetNonce = resetNonce;
    return { resetToken: issueToken({ sub: user.id, purpose: 'password-reset', type: 'reset', resetNonce }, 10 * 60) };
  });
}
function resetPassword({ resetToken, password }) {
  validatePassword(password); const claims = readToken(resetToken);
  if (claims.type !== 'reset' || claims.purpose !== 'password-reset') fail(401, 'INVALID_RESET_TOKEN', 'Password-reset session is invalid.');
  return store.transaction((state) => { const user = state.users.find((item) => item.id === claims.sub); if (!user) fail(404, 'NOT_FOUND', 'User was not found.'); const reset = state.passwordResets.find((item) => item.email === user.email); if (!reset || !reset.verified || reset.resetNonce !== claims.resetNonce) fail(401, 'INVALID_RESET_TOKEN', 'Password-reset session is invalid.'); user.passwordHash = hashPassword(password); user.updatedAt = new Date().toISOString(); state.passwordResets = state.passwordResets.filter((item) => item.email !== user.email); return { user: publicUser(user), token: tokenFor(user) }; });
}
function updateProfile(userId, { name }) { if (!String(name || '').trim()) fail(422, 'INVALID_NAME', 'Name is required.'); return store.transaction((state) => { const user = state.users.find((item) => item.id === userId); user.name = name.trim(); user.updatedAt = new Date().toISOString(); return publicUser(user); }); }
module.exports = { signup, login, authenticate, logout, startPasswordReset, verifyOtp, resetPassword, updateProfile };
