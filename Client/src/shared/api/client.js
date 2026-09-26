const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, details, status) {
    super(message);
    this.details = details;
    this.status = status;
  }
}

/**
 * Central API client.
 *
 * - Always sends `credentials: 'include'` so the browser automatically
 *   attaches the HttpOnly session cookie on every request.
 * - No longer reads or stores the JWT from localStorage.
 * - The `token` param is kept for backward-compat with old callers but is
 *   ignored — authentication is handled entirely by the cookie.
 */
export async function api(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    signal,
    credentials: 'include', // send & receive cookies
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success)
    throw new ApiError(
      payload.error?.message || 'The request could not be completed.',
      payload.error?.details,
      response.status,
    );
  return payload.data;
}

export const queryString = (filters) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
  return params.toString() ? `?${params.toString()}` : '';
};
