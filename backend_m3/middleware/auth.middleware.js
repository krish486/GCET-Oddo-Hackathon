/**
 * PLACEHOLDER — coordinate with whoever owns the auth feature.
 * Reads a bearer JWT and puts { id, role } on req.user. Swap this out
 * for the team's real implementation before merging; the shape of
 * req.user (id, role) is all this module's controllers rely on.
 */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new AppError('Not authenticated', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
};
