import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be a string!" })
    .min(2, { message: "Name must be at least 2 characters long!" })
    .max(50, { message: "Name can not exceed 50 characters!" }),

  email: z
    .string({ invalid_type_error: "Email must be a string!" })
    .email({ message: "Invalid email format!" })
    .min(5, { message: "Email must be at least 5 characters long!" }),
  // 1. uppercase letter, 1 digit, 1 special character, min 8 characters
  password: z
    .string({ invalid_type_error: "Password must be a string!" })
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "Password must contain at least one uppercase letter, one digit, and one special character!",
      }
    ),
  phone: z
    .string({ invalid_type_error: "Phone must be a string!" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message: "Invalid phone number format! Number is for Bangladesh only.",
    }),
  address: z
    .string({ invalid_type_error: "Address must be a string!" })
    .max(200, {
      message: "Address can not exceed 200 characters!",
    }),
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be a string!" })
    .min(2, { message: "Name must be at least 2 characters long!" })
    .max(50, { message: "Name can not exceed 50 characters!" })
    .optional(),

  // 1. uppercase letter, 1 digit, 1 special character, min 8 characters
  password: z
    .string({ invalid_type_error: "Password must be a string!" })
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      {
        message:
          "Password must contain at least one uppercase letter, one digit, and one special character!",
      }
    )
    .optional(),
  phone: z
    .string({ invalid_type_error: "Phone must be a string!" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message: "Invalid phone number format! Number is for Bangladesh only.",
    })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be a string!" })
    .max(200, {
      message: "Address can not exceed 200 characters!",
    })
    .optional(),
  isActive: z.enum(Object.values(IsActive) as [string]).optional(),
  role: z.enum(Object.values(Role) as [string]).optional(),
  isVerified: z
    .boolean({
      invalid_type_error: "isVerified must be a boolean!",
    })
    .optional(),
  isDeleted: z
    .boolean({
      invalid_type_error: "isDeleted must be a boolean!",
    })
    .optional(),
});
