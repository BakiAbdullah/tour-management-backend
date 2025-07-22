import z from "zod";
import { BOOKING_STATUS } from "./booking.interface";

export const createBookingZodSchema = z.object({
  tour: z.string(),
  guestCount: z
    .number()
    .int()
    .positive()
    .min(1, "Guest count must be at least 1"),
});

export const updateBookingStatusZodSchema = z.object({
  status: z.enum(Object.values(BOOKING_STATUS) as [string]),
});
