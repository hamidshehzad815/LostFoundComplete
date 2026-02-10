export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  console.error("Error:", {
    requestId: req.id,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    statusCode: error.statusCode,
  });

  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new AppError(message, 409);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    const message = messages.join(", ");
    error = new AppError(message, 400);
  }

  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please login again";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please login again";
    error = new AppError(message, 401);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message || "Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      error: err,
    }),
  });
};

export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
