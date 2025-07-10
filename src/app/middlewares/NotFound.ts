import { Request, Response } from "express";
import httpStatus from "http-status-codes";

const notFound = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Route not found!",
  });
};

export default notFound;
// This middleware will handle all the requests that do not match any route
// It should be placed after all the routes in the app.ts file
