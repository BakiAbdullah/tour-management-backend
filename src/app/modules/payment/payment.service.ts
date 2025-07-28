/* eslint-disable @typescript-eslint/no-explicit-any */
import { uploadPDFBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/AppError";
import { generatePdf, type IInvoiceData } from "../../utils/generateInvoicePdf";
import { sendEmail } from "../../utils/sendEmail";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
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
  // Todo: Generate invoice & PDF and send email
  // Todo: Upload invoice to cloudinary

  // Start a session for transaction
  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: query.transactionId },
      { status: PAYMENT_STATUS.PAID },
      { new: true, runValidators: true, session }
    );

    // >>> Update booking status to CONFIRMED
    const updatedBooking = await Booking.findByIdAndUpdate(
      updatedPayment?.booking,
      { status: BOOKING_STATUS.CONFIRMED },
      { new: true, runValidators: true, session: session }
    )
      .populate("tour", "title")
      .populate("user", "name email");

    // >>>  Generate invoice URL + Pdf
    if (!updatedBooking) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Booking not found, Please try again."
      );
    }
    if (!updatedPayment) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "Payment not found, Please try again."
      );
    }

    // >>> Generate invoice data
    const invoiceData: IInvoiceData = {
      bookingDate: updatedBooking.createdAt as Date,
      guestCount: updatedBooking.guestCount,
      totalAmount: updatedPayment.amount,
      transactionId: updatedPayment.transactionId,
      tourTitle: (updatedBooking?.tour as unknown as ITour).title,
      userName: (updatedBooking?.user as unknown as IUser).name,
    };
    // >>> Generate PDF
    const pdfBuffer = await generatePdf(invoiceData);

    // >>> Upload PDF to Cloudinary
    const cloudinaryResult = await uploadPDFBufferToCloudinary(
      pdfBuffer,
      `invoice-${updatedPayment.transactionId}`
    );

    // >>> Update payment with invoice URL field
    await Payment.findByIdAndUpdate(
      updatedPayment._id,
      {
        invoiceUrl: cloudinaryResult?.secure_url,
      },
      { runValidators: true, session: session }
    );

    // >>> Save invoice URL to payment and send email
    await sendEmail({
      to: (updatedBooking?.user as unknown as IUser).email,
      subject: "Your Tour Booking Invoice",
      templateName: "invoice",
      templateData: invoiceData,
      attachments: [
        {
          filename: `invoice-${updatedPayment.transactionId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

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

const getInvoiceDownloadUrl = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId).select("invoiceUrl")

  if (!payment) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Payment not found, Please try again."
    );
  }

  if (!payment?.invoiceUrl) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Invoice URL not found, Please try again."
    );
  }

  return {
    success: true,
    message: "Invoice ready to download!",
    invoiceUrl: payment.invoiceUrl,
  };
};

export const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getInvoiceDownloadUrl,
};
