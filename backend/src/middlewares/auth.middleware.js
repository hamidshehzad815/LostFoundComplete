import jwt from "jsonwebtoken";
import { AppError } from "./error.middleware.js";

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new AppError("Authentication required. Please login", 401);
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please login again", 401));
    }
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Token expired. Please login again", 401));
    }
    next(new AppError("Authentication failed", 401));
  }
};

export default protect;
export const authenticate = protect;

export const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      req.user = decoded;
    }
    next();
  } catch (err) {
    next();
  }
};
