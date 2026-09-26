/**
 * PLACEHOLDER — a shared axios instance normally lives in shared/ and is
 * set up by whoever owns auth (baseURL, attaching the JWT, refresh-token
 * handling, etc). This minimal version lets receipts/deliveries/transfers/
 * adjustments be built and tested independently. Delete this once the
 * real shared client exists on your branch and re-point the imports below.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
