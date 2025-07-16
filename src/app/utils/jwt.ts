import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(payload, secret, {
    expiresIn: expiresIn || "1d",
  } as SignOptions);
  return token;
};

export const verifyToken = (
  token: string,
  secret: string
): JwtPayload | null => {
  const verifiedToken = jwt.verify(token, secret);
  return verifiedToken as JwtPayload;
};
