import mongoose from "mongoose";
import { IGenericErrorResponse } from "../interfaces/error";

export const handleCastError = (
  err: mongoose.Error.CastError
): IGenericErrorResponse => {
  return {
    statusCode: 400,
    message: `Invalid MongoDB ID: ${err.value}, Provide a valid ID`,
  };
};
