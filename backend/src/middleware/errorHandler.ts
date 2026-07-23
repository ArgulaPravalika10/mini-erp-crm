import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/AppError";

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const databaseError = error as DatabaseError;

  if (databaseError.code === "23505") {
    res.status(409).json({
      message: "A record with this unique value already exists",
      details: databaseError.detail,
    });
    return;
  }

  if (databaseError.code === "23503") {
    res.status(409).json({
      message: "This record is linked to another module and cannot be changed",
      details: databaseError.detail,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    message: "Internal server error",
  });
};
