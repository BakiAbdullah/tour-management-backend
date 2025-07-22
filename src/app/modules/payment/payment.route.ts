import { Router } from "express";
import { PaymentController } from "./payment.controller";

const router = Router();


router.post("/init-payment/:bookingId", PaymentController.initPayment);
router.post("/success", PaymentController.paymentSuccess);
router.post("/fail", PaymentController.paymentFail);
router.post("/cancel", PaymentController.paymentCancel);

export const PaymentRoutes = router;
