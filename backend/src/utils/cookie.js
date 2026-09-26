/**
 * Cookie helpers – pure string parsing/serialization, no external deps.
 */

/**
 * Parse the Cookie request header into a plain object.
 * @param {string} header
 * @returns {Record<string,string>}
 */
function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const pair of String(header).split(';')) {
    const index = pair.indexOf('=');
    if (index < 0) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/**
 * Serialize a cookie for the Set-Cookie response header.
 */
function serializeCookie(name, value, options = {}) {
  const {
    httpOnly = true,
    secure = false,
    sameSite = 'Lax',
    path = '/',
    maxAge,
  } = options;

  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (path) cookie += `; Path=${path}`;
  if (maxAge != null) cookie += `; Max-Age=${maxAge}`;
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  return cookie;
}

/**
 * Build a Set-Cookie header that clears the given cookie.
 */
function clearCookie(name) {
  return serializeCookie(name, '', { maxAge: 0 });
}

const SESSION_COOKIE = 'stocksense_session';

/**
 * Whether we should set the Secure attribute on cookies.
 * True in production, false in development so HTTP localhost works.
 */
const isSecure = () => process.env.NODE_ENV === 'production';

/**
 * Set the auth session cookie on the response.
 * Max-Age is 8 hours, matching the JWT expiry.
 */
function setSessionCookie(response, token) {
  response.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isSecure(),
      sameSite: isSecure() ? 'None' : 'Lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
    }),
  );
}

/**
 * Clear the auth session cookie on the response.
 */
function clearSessionCookie(response) {
  response.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: isSecure(),
      sameSite: isSecure() ? 'None' : 'Lax',
      path: '/',
      maxAge: 0,
    }),
  );
}

/**
 * Extract the session token from the cookie header.
 * Falls back to the Authorization Bearer header for backward compatibility
 * and for the integration tests that still send tokens via header.
 * @param {object} context - request context with headers
 * @returns {string|null}
 */
function getSessionToken(context) {
  const cookies = parseCookies(context.headers.cookie);
  if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];

  // Fallback: Authorization: Bearer <token>  (used by integration tests)
  const auth = context.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  return null;
}

module.exports = {
  parseCookies,
  serializeCookie,
  clearCookie,
  SESSION_COOKIE,
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
};
