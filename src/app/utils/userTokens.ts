import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IsActive, IUser } from "../modules/user/user.interface";
import { generateToken, verifyToken } from "./jwt";
import httpStatus from "http-status-codes";
import { User } from "../modules/user/user.model";
import { JwtPayload } from "jsonwebtoken";

export const createUserTokens = (user: Partial<IUser>) => {

  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  // Generate JWT access token
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_SECRET as string,
    envVars.JWT_EXPIRES_IN as string
  );

  // Generate JWT refresh token
  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES_IN as string
  );

  return {
    accessToken, refreshToken
  }
};

export const createNewAccessTokenWithRefreshToken = async (refreshToken: string) => { 
   const verifiedRefreshToken = verifyToken(
     refreshToken,
     envVars.JWT_REFRESH_SECRET
   ) as JwtPayload;

   // Finding user by email from the verified token
   const isUserExist = await User.findOne({
     email: verifiedRefreshToken.email,
   });

   // Check if user exists or its status is Deleted, Blocked or Inactive
   if (!isUserExist) {
     throw new AppError(
       httpStatus.BAD_REQUEST,
       "User does not exist with this email!"
     );
   }

   if (
     isUserExist.isActive === IsActive.BLOCKED ||
     isUserExist.isActive === IsActive.INACTIVE
   ) {
     throw new AppError(httpStatus.BAD_REQUEST, "User is blocked or inactive!");
   }
   if (isUserExist.isDeleted) {
     throw new AppError(httpStatus.BAD_REQUEST, "User is deleted!");
   }

   // JWT payload for access token
   const jwtPayload = {
     userId: isUserExist._id,
     email: isUserExist.email,
     role: isUserExist.role,
   };

   // Generate JWT access token
   const accessToken = generateToken(
     jwtPayload,
     envVars.JWT_SECRET as string,
     envVars.JWT_EXPIRES_IN as string
   );

   return {
     accessToken,
   };
}
