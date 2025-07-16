/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/AppError";
import { setAuthCookieUtil } from "../../utils/setCookies";
import { createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // const loginInfo = await AuthServices.credentialsLogin(req.body);❌

    // From now on we will use passportjs for authentication (passport.authenticate)✅
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        // ❌❌❌
        //* throw new AppError(400, 'message'); 
        // return new AppError(401, err);
        // next(err)
        
        // ✅✅✅
        // return next(err);
        return next(new AppError(401, err));
      }

      if (!user) {
        // return new AppError(401, info.message); ❌
        return next(new AppError(401, info.message));
      }

      const userTokens = createUserTokens(user);
      // Remove password from user object
      const { password: pass, ...userWithoutPassword } = user.toObject();

      // Set access and refresh tokens in cookies
      setAuthCookieUtil(res, userTokens);

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User Logged in successfully",
        data: {
          accessToken: userTokens.accessToken,
          refreshToken: userTokens.refreshToken,
          user: userWithoutPassword, //* This will be the user object returned by the local strategy
        },
      });
    })(req, res, next);

    //❌ res.cookie('accessToken', loginInfo.accessToken, {
    //   httpOnly: true,
    //   secure: false,
    // })

    // Setting refresh token in browser cookies when user logs in.
    // res.cookie('refreshToken', loginInfo.refreshToken, {
    //   httpOnly: true,
    //   secure: false, //* Set to true if using HTTPS
    // });

    // Using the setAuthCookie utility function to set both access and refresh tokens
  }
);

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    //* const refreshToken = req.headers.authorization; // for testing purpose
    if (!refreshToken) {
      return next(
        new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing!")
      );
    }

    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    //  Setting NEW Access token in browser cookies when user requests a new access token.
    // res.cookie("accessToken", tokenInfo.accessToken, {
    //   httpOnly: true,
    //   secure: false,
    // });

    // Using the setAuthCookie utility function to set both access and refresh tokens
    setAuthCookieUtil(res, tokenInfo.accessToken);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "New access token retrieved successfully!",
      data: tokenInfo,
    });
  }
);

const logout = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User logged out successfully!",
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const decodedToken = req.user;

    await AuthServices.resetPassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password reset successfully!",
      data: null,
    });
  }
);

// Function to handle Google OAuth callback
const googleCallbackController = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let redirectTo = req.query.state ? (req.query.state as string) : "";

    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1); // Remove leading slash if present
    }
    const user = req.user; //* This will be set by the passport-google-oauth strategy

    if (!user) {
      return next(new AppError(httpStatus.NOT_FOUND, "User not found!"));
    }
    const tokenInfo = createUserTokens(user);

    setAuthCookieUtil(res, tokenInfo);

    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`); // Redirect to the frontend URL with the path
  }
);

export const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  resetPassword,
  googleCallbackController,
};
