import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { BookingService } from "./booking.service";
import { JwtPayload } from "jsonwebtoken";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const booking = await BookingService.createBooking(req.body, decodedToken?.userId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created",
    data: booking,
  });
});

const getUserBookings = catchAsync(async (req: Request, res: Response) => {
  // const userId = req?.user?.id; // Assuming user ID is stored in req.user
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved",
    // data: result.data,
  });
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved",
    // data: result.data,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved",
  });
});

const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking status updated",
    // data: result,
  });
});


export const BookingController = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  getUserBookings,
  updateBookingStatus 
};
