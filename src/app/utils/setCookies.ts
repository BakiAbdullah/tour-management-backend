import { Response } from "express";

export interface IAuthTokens {
    accessToken?: string;
    refreshToken?: string;
}

export const setAuthCookieUtil = (res: Response, tokenInfo: IAuthTokens) => {
    if (tokenInfo.accessToken) {
      // Setting access token in browser cookies when user logs in.
      res.cookie("accessToken", tokenInfo.accessToken, {
        httpOnly: true,
        secure: false,
      });
    }

    if (tokenInfo.refreshToken) {
      // Setting refresh token in browser cookies when user logs in.
      res.cookie("refreshToken", tokenInfo.refreshToken, {
        httpOnly: true,
        secure: false,
      });
    }
}