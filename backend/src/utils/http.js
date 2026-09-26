class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const fail = (status, code, message, details) => { throw new AppError(status, code, message, details); };
const send = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};
const success = (res, data, message = 'OK', status = 200, meta) => send(res, status, { success: true, message, data, ...(meta ? { meta } : {}) });
const error = (res, err) => send(res, err.status || 500, {
  success: false,
  error: { code: err.code || 'INTERNAL_ERROR', message: err.status ? err.message : 'An unexpected server error occurred.', ...(err.details ? { details: err.details } : {}) },
});

module.exports = { AppError, fail, success, error };
