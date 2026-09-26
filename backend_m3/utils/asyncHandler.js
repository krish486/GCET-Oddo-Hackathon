// Wraps async route handlers so we don't need try/catch in every controller.
// Any rejected promise is forwarded to Express's error middleware.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
