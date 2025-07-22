import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PaymentService } from "./payment.service";
import { envVars } from "../../config/env";
import { sendResponse } from "../../utils/sendResponse";

const initPayment = catchAsync(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    const result = await PaymentService.initPayment(bookingId);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Payment done successfully!",
        data: result,
      });
});

const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await PaymentService.successPayment(query);
  if (result.success) {
    // Redirect to the frontend success page with query parameters for frontend handling
    res.redirect(
      `${envVars.SSL.SSL_SUCCESS_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

const paymentFail = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await PaymentService.failPayment(query);
  if (!result.success) {
    // Redirect to the frontend FAIL page with query parameters for frontend handling
    res.redirect(
      `${envVars.SSL.SSL_FAIL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

const paymentCancel = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as Record<string, string>;
  const result = await PaymentService.cancelPayment(query);
  if (!result.success) {
    // Redirect to the frontend CANCEL page with query parameters for frontend handling
    res.redirect(
      `${envVars.SSL.SSL_CANCEL_FRONTEND_URL}?transactionId=${query.transactionId}&message=${result.message}&amount=${query.amount}&status=${query.status}`
    );
  }
});

export const PaymentController = {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
};
