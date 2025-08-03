/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError";
import httpstatus from "http-status-codes";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { User } from "../user/user.model";
import { BOOKING_STATUS, IBooking } from "./booking.interface";
import { Payment } from "../payment/payment.model";
import { Booking } from "./booking.model";
import { Tour } from "../tour/tour.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { getTransactionId } from "../../utils/getTransactionID";


const createBooking = async (payload: Partial<IBooking>, userId: string) => {
  const transactionId = getTransactionId();

  // Start a session for transaction
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId);

    if (!user?.phone || !user?.address) {
      throw new AppError(
        httpstatus.BAD_REQUEST,
        "Please Update your Profile with Phone and Address, to book a tour"
      );
    }

    const tour = await Tour.findById(payload.tour).select("costFrom");

    if (!tour?.costFrom) {
      throw new AppError(httpstatus.BAD_REQUEST, "Tour cost not found!");
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const amount = Number(tour.costFrom) * Number(payload.guestCount!);

    const booking = await Booking.create(
      [
        {
          user: userId,
          status: BOOKING_STATUS.PENDING,
          ...payload,
        },
      ],
      { session }
    );

    const payment = await Payment.create(
      [
        {
          booking: booking[0]._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId: transactionId,
          amount: amount,
        },
      ],
      { session }
    );

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking[0]._id,
      { payment: payment[0]._id },
      { new: true, runValidators: true, session: session }
    )
      .populate("user", "name email phone address")
      .populate("tour", "title costFrom")
      .populate("payment");

    const userAddress = (updatedBooking?.user as any).address;
    const userEmail = (updatedBooking?.user as any).email;
    const userPhoneNumber = (updatedBooking?.user as any).phone;
    const userName = (updatedBooking?.user as any).name;

    const sslPayload: ISSLCommerz = { 
      name: userName,
      address: userAddress,
      email: userEmail,
      phone: userPhoneNumber,
      amount: amount,
      transactionId: transactionId,
    };

    // SSL Payment
    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    // Commit the transaction
    await session.commitTransaction();
    // End the session
    session.endSession();

    return {
      paymentUrl: sslPayment?.GatewayPageURL as string,
      booking: updatedBooking,
    };
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    //* throw new AppError(httpstatus.INTERNAL_SERVER_ERROR, error.message); ❌❌❌
    throw error; // ✅✅✅
  }
};
// SSLCommerz Payment Flow ~~~
// Scenario 2: if payment is successful
// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(unpaid) --> SSLComerze page --> Payment Complete --> Backend(localhost:5000/api/v1/payment/success) --> Update Payment(Paid) and Booking status(Confirmed) --> Redirect to success page, Frontend(localhost:5173/payment/success)

//! Scenario 2: if something goes wrong in the payment process
// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(unpaid) --> SSLComerz page --> Payment Failed / canceled --> Backend(localhost:5000/api/v1/payment/fail) -> Update Payment(Failed) and Booking status(Canceled / Failed) --> Redirect to failed page, Frontend(localhost:5173/payment/failed)

const getUserBookings = async (userId: string) => {
  const userBookings = await Booking.find({ user: userId });
  if (!userBookings || userBookings.length === 0) {
    throw new AppError(httpstatus.NOT_FOUND, "No bookings found for this user");
  }
  return {
    data: userBookings,
  };
};

const getSingleBooking = async (bookingId: string) => {
  const singleBooking = await Booking.findById(bookingId);

  if (!singleBooking) {
    throw new AppError(httpstatus.NOT_FOUND, "Booking not found");
  }
  return {
    data: singleBooking,
  };
};

const updateBookingStatus = async (
  bookingId: string,
  payload: Partial<IBooking>
) => {
  const updatedStatus = payload.status;
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    { status: updatedStatus },
    { new: true, runValidators: true }
  );
  if (!updatedBooking) {
    throw new AppError(httpstatus.NOT_FOUND, "Booking not found");
  }
  return {
    data: updatedBooking,
  };
};

const getAllBookings = async () => {
  const allBookings = await Booking.find();
  return {
    data: allBookings,
  };
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  getUserBookings,
  updateBookingStatus,
};
