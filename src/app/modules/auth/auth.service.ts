/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";
import bcryptjs from "bcryptjs";
import { createNewAccessTokenWithRefreshToken } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { IAuthProvider } from "../user/user.interface";

// Function to handle user login with credentials (We will use passport.js for this, passport js will handling our service logics) ❌

// const credentialsLogin = async (payload: Partial<IUser>) => {
//   const { email, password } = payload;

//   // Finding user by email
//   const isUserExist = await User.findOne({ email });

//   if (!isUserExist) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       "User does not exist with this email!"
//     );
//   }

//   const isPasswordMatched = await bcryptjs.compare(
//     password as string,
//     isUserExist.password as string
//   );
//   if (!isPasswordMatched) {
//     throw new AppError(httpStatus.UNAUTHORIZED, "Password is incorrect!");
//   }

//   const userTokens = createUserTokens(isUserExist);

//   // Remove password from user object
//   const { password: pass, ...userWithoutPassword } = isUserExist.toObject();

//   return {
//     accessToken: userTokens.accessToken,
//     refreshToken: userTokens.refreshToken,
//     user: userWithoutPassword,
//   };
// };

// Function to create a new access token using the refresh token (See => userTokens.ts for details)
const getNewAccessToken = async (refreshToken: string) => {
  const newAccessToken = await createNewAccessTokenWithRefreshToken(
    refreshToken
  );

  return {
    accessToken: newAccessToken,
  };
};

const resetPassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  // const user = await User.findById(decodedToken.userId);
  // const isOldPasswordMatched = await bcryptjs.compare(
  //   oldPassword,
  //   user?.password as string
  // );
  // if (!isOldPasswordMatched) {
  //   throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match!");
  // }
  // if (!user) {
  //   throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  // }
  // user.password = await bcryptjs.hash(
  //   newPassword,
  //   Number(envVars.BCRYPT_SALT_ROUNDS)
  // );
  // await user.save();
};

const setPassword = async (userId: string, plainPassword: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

   // If the user has a password, we will not allow them to set a new password
  if (
    user.password &&
    user.auths.some((providerObject) => providerObject.provider === "google")
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already set your password. Now you can change the password from your profile settings."
    );
  }

  const hashedPassword = await bcryptjs.hash(
    plainPassword,
    Number(envVars.BCRYPT_SALT_ROUNDS)
  );

  // If the user has no password, we will add the credentials provider
  // Otherwise, we will just update the password
  const auths: IAuthProvider[] = [
    ...user.auths,
    { provider: "credentials", providerId: user.email },
  ];

  // If the user has a password, we will update it
  user.auths = auths;
  user.password = hashedPassword;

  // Remove the password from the user object before saving
  await user.save();
};

const changePassword = async (
  oldPassword: string,
  newPassword: string,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(decodedToken.userId);
  const isOldPasswordMatched = await bcryptjs.compare(
    oldPassword,
    user?.password as string
  );

  if (!isOldPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Old password does not match!");
  }

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  user.password = await bcryptjs.hash(
    newPassword,
    Number(envVars.BCRYPT_SALT_ROUNDS)
  );

  await user.save();
};

export const AuthServices = {
  // credentialsLogin,
  getNewAccessToken,
  resetPassword,
  setPassword,
  changePassword,
};
