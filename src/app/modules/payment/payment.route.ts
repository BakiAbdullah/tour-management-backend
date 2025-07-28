import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

const router = Router();

// Redirect urls, we are not hitting these endpoints directly
router.post("/init-payment/:bookingId", PaymentController.initPayment);
router.post("/success", PaymentController.paymentSuccess);
router.post("/fail", PaymentController.paymentFail);
router.post("/cancel", PaymentController.paymentCancel);
router.get("/invoice/:paymentId", checkAuth(...Object.values(Role)), PaymentController.getInvoiceDownloadUrl);

export const PaymentRoutes = router;
