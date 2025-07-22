/* eslint-disable no-unused-vars */
// Flow ===>>> User > Boooking(pending) > Payment(unpaid) > SSLCommerze > Booking update confirm > Payment update (Paid )

import { Types } from "mongoose";

export enum BOOKING_STATUS {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED"
}

export interface IBooking {
    user: Types.ObjectId;
    tour: Types.ObjectId;
    payment?: Types.ObjectId;
    guestCount: number;
    status: BOOKING_STATUS;
}