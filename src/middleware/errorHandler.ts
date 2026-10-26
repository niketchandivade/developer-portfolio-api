import type { ErrorRequestHandler } from "express";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
