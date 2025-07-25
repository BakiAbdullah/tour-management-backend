import { Request, Response, NextFunction } from "express";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { verifyToken } from "../utils/jwt";
import httpStatus from "http-status-codes";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = await req.headers.authorization;
      if (!accessToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Access token is required");
      }
      const verifiedToken = await verifyToken(
        accessToken,
        envVars.JWT_SECRET as string
      );

      if (!verifiedToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid access token");
      }

      // Check if user exists or its status is Deleted, Blocked or Inactive
      const isUserExist = await User.findOne({ email: verifiedToken.email });

      if (!isUserExist) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User does not exist with this email!"
        );
      }

      if (isUserExist.isVerified === false) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is not verified!");
      }

      if (
        isUserExist.isActive === IsActive.BLOCKED ||
        isUserExist.isActive === IsActive.INACTIVE
      ) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "User is blocked or inactive!"
        );
      }
      if (isUserExist.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "User is deleted!");
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource"
        );
      }

      // Attach user information to the request object **********
      req.user = verifiedToken;

      next();
    } catch (error) {
      next(error);
    }
  };
