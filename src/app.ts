import express, { NextFunction, Request, Response } from "express";
import { UserRoutes } from "./app/modules/user/user.route";
import cors from "cors";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/NotFound";

const app = express();
app.use(express.json());
app.use(cors());

// Step 1: Initialize User Routes
app.use("/api/v1/", router);  


app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Tour Management System Backend!",
  });
});

// Global Error Handler and Not Found Middleware >>>>>>>
app.use(globalErrorHandler);
app.use(notFound);

export default app;
