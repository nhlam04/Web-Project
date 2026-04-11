function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";

  return res.status(status).json({
    error: {
      code,
      message: err.message || "Unexpected error",
    },
  });
}

module.exports = { errorHandler };
