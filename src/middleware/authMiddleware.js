// ─── Middleware ────────────────────────────────────────────────────────────────

/**
 * Validates that required fields are present in req.body.
 * Usage: validate("name", "password")
 */
const validate = (...fields) => (req, res, next) => {
  const missing = fields.filter((f) => !req.body[f]?.toString().trim());
  if (missing.length) {
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missing.join(", ")}` });
  }
  next();
};

/**
 * Wraps an async route handler and forwards errors to Express error middleware.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Centralized error handler for the auth router.
 * Maps known error types to appropriate HTTP status codes.
 * Register this last on the router: router.use(authErrorHandler)
 */
const authErrorHandler = (err, req, res, _next) => {
  const statusMap = {
    UnauthorizedError: 401,
    ForbiddenError: 403,
    NotFoundError: 404,
    ConflictError: 409,
    ValidationError: 422,
  };

  const status = statusMap[err.name] ?? 500;
  const message = status < 500 ? err.message : "Internal server error";

  if (status >= 500) console.error("[AuthRouter]", err);

  res.status(status).json({ error: message });
};

module.exports = { validate, asyncHandler, authErrorHandler };