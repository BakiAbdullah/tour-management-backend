import { redisClient } from "../../config/redis.config";
import { sendEmail } from "../../utils/sendEmail";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { generateOTP } from "../../utils/generateOTP";

const OTP_EXPIRATION = 2 * 60; // 2 minutes in seconds

const sendOtp = async (email: string, name: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user?.isVerified) {
    throw new AppError(400, "You are already verified");
  }

  const otp = generateOTP();
  const redisKey = `otp:${email}`;

  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name,
      otp: otp,
    },
  });
};

const verifyOTP = async (email: string, otp: string) => {   
  // const user = await User.findOne({ email, isVerified: false });
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (user?.isVerified) {
    throw new AppError(400, "You are already verified");
  }

  
  const redisKey = `otp:${email}`; // >>> Key for storing OTP in Redis
  const savedOtp = await redisClient.get(redisKey); // >>> Retrieve the OTP from Redis

  if (!savedOtp) {
    throw new AppError(401, "Invalid OTP");
  }

  if (savedOtp !== otp) {
    throw new AppError(401, "Invalid OTP");
  }

  // >>> Update the user's verification status and remove the OTP from Redis
  await Promise.all([
    await User.updateOne(
      { email },
      { isVerified: true },
      { runValidators: true }
    ),
    await redisClient.del([redisKey]),
  ]);
};

export const OTPService = {
  sendOtp,
  verifyOTP,
};
