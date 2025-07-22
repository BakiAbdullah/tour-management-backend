/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/AppError";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import httpStatus from "http-status-codes";

const initPayment = async (bookingId: string) => {
  const payment = await Payment.findOne({ booking: bookingId });

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment not found, You have not booked this tour yet."
    );
  }

  const booking = await Booking.findById(payment.booking);

  // Creating SSL payload
  const userAddress = (booking?.user as any).address;
  const userEmail = (booking?.user as any).email;
  const userPhoneNumber = (booking?.user as any).phone;
  const userName = (booking?.user as any).name;

  // SSL payload
  const sslPayload: ISSLCommerz = {
    name: userName,
    address: userAddress,
    email: userEmail,
    phone: userPhoneNumber,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  // SSL Payment
  const sslPayment = await SSLService.sslPaymentInit(sslPayload);
  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  //Todo: Update booking status to confirm
  //Todo: Update Payment status to PAID

  // Start a session for transaction
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: PAYMENT_STATUS.PAID },
      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.CONFIRMED },
      { runValidators: true, session: session }
    );

    // Commit the transaction
    await session.commitTransaction();
    // End the session
    session.endSession();

    return {
      success: true,
      message: "Payment completed successfully!",
    };
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    //* throw new AppError(httpstatus.INTERNAL_SERVER_ERROR, error.message); ❌❌❌
    throw error; // ✅✅✅
  }
};

const failPayment = async (query: Record<string, string>) => {
  // Update booking status to FAIL
  // Update Payment status to FAIL

  // Start a session for transaction
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: PAYMENT_STATUS.FAILED },
      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.FAILED },
      { runValidators: true, session: session }
    );

    // Commit the transaction
    await session.commitTransaction();
    // End the session
    session.endSession();

    return {
      success: false,
      message: "Payment failed!",
    };
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    //* throw new AppError(httpstatus.INTERNAL_SERVER_ERROR, error.message); ❌❌❌
    throw error; // ✅✅✅
  }
};

const cancelPayment = async (query: Record<string, string>) => {
  // Update booking status to CANCEL
  // Update Payment status to CANCEL

  // Start a session for transaction
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: PAYMENT_STATUS.CANCELLED },
      { new: true, runValidators: true, session }
    );

    await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.CANCELLED },
      { runValidators: true, session: session }
    );

    // Commit the transaction
    await session.commitTransaction();
    // End the session
    session.endSession();

    return {
      success: false,
      message: "Payment Canceled!",
    };
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    session.endSession();
    //* throw new AppError(httpstatus.INTERNAL_SERVER_ERROR, error.message); ❌❌❌
    throw error; // ✅✅✅
  }
};

export const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};
