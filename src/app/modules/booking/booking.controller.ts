import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import { JwtPayload } from "jsonwebtoken";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const booking = await BookingService.createBooking(
    req.body,
    decodedToken?.userId
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created",
    data: booking,
  });
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const bookings = await BookingService.getUserBookings(decodedToken?.userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: bookings,
  });
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const booking = await BookingService.getSingleBooking(bookingId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: booking,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const bookings = await BookingService.getAllBookings();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "All bookings retrieved successfully",
    data: bookings,
    // meta: {},
  });
});
  
const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  const bookingId = req.params.bookingId;
  const updatedBooking = await BookingService.updateBookingStatus(bookingId, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking status updated",
    data: updatedBooking,
  });
});

export const BookingController = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  getUserBookings,
  updateBookingStatus,
};
