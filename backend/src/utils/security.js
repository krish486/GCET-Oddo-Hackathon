const crypto = require('node:crypto');
const { fail } = require('./http');

const secret = () => process.env.JWT_SECRET || 'change-this-development-secret-before-production';
const base64Url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
const sign = (value) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
};
const issueToken = (payload, expiresInSeconds = 60 * 60 * 8) => {
  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = base64Url({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = base64Url({ ...payload, iat: now, exp: now + expiresInSeconds, jti: crypto.randomUUID() });
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  return `${unsigned}.${sign(unsigned)}`;
};
const readToken = (token) => {
  const [header, payload, signature] = String(token || '').split('.');
  const expectedSignature = header && payload ? sign(`${header}.${payload}`) : '';
  const actualBuffer = Buffer.from(signature || '');
  const expectedBuffer = Buffer.from(expectedSignature);
  if (!header || !payload || !signature || actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    fail(401, 'INVALID_TOKEN', 'Your session is invalid. Please sign in again.');
  }
  let decoded;
  try { decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { fail(401, 'INVALID_TOKEN', 'Your session is invalid. Please sign in again.'); }
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) fail(401, 'TOKEN_EXPIRED', 'Your session has expired. Please sign in again.');
  return decoded;
};
const otp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const hashValue = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

module.exports = { hashPassword, verifyPassword, issueToken, readToken, otp, hashValue };
