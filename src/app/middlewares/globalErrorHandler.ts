/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { handleDuplicateError } from "../errors/handleDuplicateError";
import { handleValidationError } from "../errors/handleValidationError";
import { handleCastError } from "../errors/handleCastError";
import { IErrorSource } from "../interfaces/error";
import { handleZodError } from "../errors/handleZodError";
import { deleteImageFromCloudinary } from "../config/cloudinary.config";

/**
 * Global error handling middleware for Express applications.
 *
 * Handles and formats errors from various sources including Mongoose, Zod, and custom application errors.
 * - Logs errors in development mode.
 * - Deletes uploaded files from Cloudinary if present in the request.
 * - Handles duplicate key errors, cast errors, validation errors (Mongoose & Zod), and custom AppError instances.
 * - Returns a standardized error response with status code, message, error sources, and stack trace (in development).
 *
 * @returns Sends a JSON response with error details.
 */
export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = `Something went Wrong!`;
  let errorSources: IErrorSource[] = [];
  if (envVars.NODE_ENV === "development") {
    console.log(err);
  }

  //! DELETE images from Cloudinary if any error occurs
  if (req.file) {
    await deleteImageFromCloudinary(req.file.path);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imgUrl = (req.files as Express.Multer.File[]).map(
      (file) => file.path
    );
    await Promise.all(imgUrl.map((img) => deleteImageFromCloudinary(img)));
  }

  // Handling specific error types for Mongoose && ZOD 🔴🟡🟢

  // Duplicate Key Error
  if (err.code === 11000) {
    const simplifiedError = handleDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Cast Error / ObjectId Error
  else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Mongoose Validation Error
  else if (err.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError?.errorSources as IErrorSource[];
  }
  // Zod Validation Error
  else if (err.name === "ZodError") {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError?.errorSources as IErrorSource[];
  }

  // Our Custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose Error
  else if (err instanceof Error) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    err: envVars.NODE_ENV === "development" ? err : null,
    stack: envVars.NODE_ENV === "development" ? err.stack : null,
  });
};

// Our custom ErrorPattern
/*
 * Success:
 * message:
 * errorSources: [
 *    path: '',
 *    message: 'Something went wrong',
 * ]
 */
