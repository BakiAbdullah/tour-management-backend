/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { envVars } from "./app/config/env";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL as string);
    console.log("Connected to DB!!");

    server = app.listen(envVars.PORT, () => {
      console.log(`Server is listening to port ${envVars.PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();

//! Handling Signal termination
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down gracefully...");

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

// This is for manual termination of the server using Ctrl + C
process.on("SIGINT", () => {
  console.log("SIGINT signal received. Shutting down gracefully...");

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

//! Handling unhandled rejection error & Promise
process.on("unhandledRejection", (err) => {
  console.log("unhandled Rejection detected... Server shutting down..", err);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

//! Handling uncaught rejection error
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception detected... Server shutting down..", err);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

// unhandled rejection error
// Promise.reject(new Error("I forgot to catch this promise!!"));

// uncaught exception error
// throw new Error("I forgot to handle this local error!!")

/**
 * unhandled rejection error
 * uncaught rejection error
 * signal termination system
 */
