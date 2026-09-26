const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(message, details, status) { super(message); this.details = details; this.status = status; }
}

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    signal,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success) throw new ApiError(payload.error?.message || 'The request could not be completed.', payload.error?.details, response.status);
  return payload.data;
}

export const queryString = (filters) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  return params.toString() ? `?${params.toString()}` : '';
};
