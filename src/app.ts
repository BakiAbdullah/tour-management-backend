import express, { Request, Response } from "express";
import cors from "cors";
import './app/config/passport';
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/NotFound";
import cookieParser from "cookie-parser";
import passport from "passport";
import expressSession from "express-session";
import { envVars } from "./app/config/env";
import { rateLimit } from "express-rate-limit";


const app = express();

const limiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 50, // Limit each IP to 10 requests per `window` (here, per 15 minutes).
});
// >>> Apply the rate limiting middleware to all requests.
app.use(limiter);

// >>> Middlewares
app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(cors({
  origin: envVars.FRONTEND_URL,
  credentials: true, // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
