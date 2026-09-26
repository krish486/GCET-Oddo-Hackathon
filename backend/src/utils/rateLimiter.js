/**
 * Simple in-memory rate limiter.
 *
 * Uses a sliding window: each key tracks an array of timestamps.
 * Old timestamps outside the window are discarded on each check.
 * This is intentionally simple (no Redis/persistence) — fine for a hackathon.
 */

/** @type {Map<string, number[]>} */
const windows = new Map();

/**
 * Clean up stale keys every 10 minutes to prevent memory growth.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of windows) {
    const valid = times.filter((t) => now - t < 15 * 60 * 1000);
    if (valid.length === 0) {
      windows.delete(key);
    } else {
      windows.set(key, valid);
    }
  }
}, 10 * 60 * 1000).unref(); // .unref() so it does not prevent process exit

/**
 * Check the rate limit for a given key.
 *
 * @param {string}  key         - Unique identifier (e.g. IP + route).
 * @param {number}  limit       - Max requests allowed in the window.
 * @param {number}  windowMs    - Window size in milliseconds.
 * @returns {{ allowed: boolean, remaining: number, resetIn: number }}
 */
function check(key, limit, windowMs) {
  const now = Date.now();
  const times = (windows.get(key) || []).filter((t) => now - t < windowMs);
  times.push(now);
  windows.set(key, times);

  const allowed = times.length <= limit;
  const oldest = times[0];
  const resetIn = Math.ceil((oldest + windowMs - now) / 1000);
  return { allowed, remaining: Math.max(0, limit - times.length), resetIn };
}

/**
 * Reset the rate limit for a key (e.g. on successful login).
 * @param {string} key
 */
function reset(key) {
  windows.delete(key);
}

module.exports = { check, reset };
