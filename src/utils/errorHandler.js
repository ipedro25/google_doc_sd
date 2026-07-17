function errorHandler(err, req, res, next) {
  const statusMap = {
    UnauthorizedError: 401,
    ForbiddenError:    403,
    NotFoundError:     404,
    ConflictError:     409,
    ValidationError:   422,
  };

  const status  = statusMap[err.name] ?? 500;
  const message = status < 500 ? err.message : "Internal server error";

  if (status >= 500) console.error("[ErrorHandler]", err);

  res.status(status).json({ error: message });
}

module.exports = errorHandler;