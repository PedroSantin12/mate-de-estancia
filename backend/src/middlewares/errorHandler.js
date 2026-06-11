function notFoundHandler(req, _res, next) {
  const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message:
        statusCode >= 500
          ? "Ocorreu um erro interno no servidor."
          : error.message,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
