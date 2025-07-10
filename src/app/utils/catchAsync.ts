import { NextFunction, Request, Response } from "express";

type TAsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const catchAsync =
  (fn: TAsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.log("Error occurred in CatchAsync:", err);
      next(err);
    });
  };
