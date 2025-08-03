/* eslint-disable @typescript-eslint/no-explicit-any */
import { Booking } from "../booking/booking.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Payment } from "../payment/payment.model";
import { Tour } from "../tour/tour.model";
import { IsActive } from "../user/user.interface";
import { User } from "../user/user.model";

//* <<< This file contains the StatsService which provides methods to retrieve various statistics related to users, tours, bookings, and payments. >>>

const now = new Date();
const sevenDaysAgo = new Date(now).setDate(now.getDate() - 7);
const thirtyDaysAgo = new Date(now).setDate(now.getDate() - 30);

const getUserStats = async () => {
  const totalUsersPromise = User.countDocuments();
  const totalActiveUsersPromise = User.countDocuments({
    isActive: IsActive.ACTIVE,
  });

  const totalInactiveUsersPromise = User.countDocuments({
    isActive: IsActive.INACTIVE,
  });

  const totalBlockedUsersPromise = User.countDocuments({
    isActive: IsActive.BLOCKED,
  });

  const newUsersLast7DaysPromise = User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  const newUsersLast30DaysPromise = User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const usersByRolePromise = User.aggregate([
    // stage-1: Grouping users by role and count total users in each role
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const [
    totalUsers,
    totalActiveUsers,
    totalInactiveUsers,
    totalBlockedUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    usersByRole,
  ] = await Promise.all([
    totalUsersPromise,
    totalActiveUsersPromise,
    totalInactiveUsersPromise,
    totalBlockedUsersPromise,
    newUsersLast7DaysPromise,
    newUsersLast30DaysPromise,
    usersByRolePromise,
  ]);
  return {
    totalUsers,
    totalActiveUsers,
    totalInactiveUsers,
    totalBlockedUsers,
    newUsersLast7Days,
    newUsersLast30Days,
    usersByRole,
  };
};

const getTourStats = async () => {
  const totalTourPromise = Tour.countDocuments();

  const totalTourByTourTypePromise = Tour.aggregate([
    // stage-1: connect Tour Type collection -lookup stage
    {
      $lookup: {
        from: "tourtypes",
        localField: "tourType",
        foreignField: "_id",
        as: "typeOfTour",
      },
    },
    // stage-2: Unwind the type array to Object
    {
      $unwind: "$typeOfTour",
    },
    // stage-3: Grouping tours by tour type and count total tours in each type
    {
      $group: {
        _id: "$typeOfTour.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const avgTourCostPromise = Tour.aggregate([
    // stage-1: Group the costFrom fields , do sum and average the cost of tours
    {
      $group: {
        _id: null,
        totalCost: { $sum: "$costFrom" },
        averageCost: { $avg: "$costFrom" },
      },
    },
  ]);

  const totalTourByDivisionPromise = Tour.aggregate([
    // stage-1: connect Division Type collection -lookup stage
    {
      $lookup: {
        from: "divisions",
        localField: "division",
        foreignField: "_id",
        as: "division",
      },
    },
    // stage-2: Unwind the type array to Object
    {
      $unwind: "$division",
    },
    // stage-3: Grouping tours by tour type and count total tours in each type
    {
      $group: {
        _id: "$division.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const highestBookedTourPromise = Booking.aggregate([
    // stage-1: Group the tours -lookup stage
    {
      $group: {
        _id: "$tour",
        bookingCount: { $sum: 1 },
      },
    },

    // stage-2: Sort the tours by booking count in descending order
    { $sort: { bookingCount: -1 } },
    // stage-3: Sorting:- Limit to get the highest booked tour
    {
      $limit: 5,
    },
    // stage-4: Lookup to get the tour details
    {
      $lookup: {
        from: "tours", // collection name
        // localField: "tour",
        let: { tourId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$tourId"] },
            },
          },
        ],
        as: "tourDetails",
      },
    },
    // stage-5: Unwind the tourDetails array to -> Object
    {
      $unwind: "$tourDetails",
    },
    // stage-6: Project the required fields
    {
      $project: {
        bookingCount: 1,
        "tourDetails.title": 1,
        "tourDetails.slug": 1,
        "tourDetails.costFrom": 1,
      },
    },
  ]);

  const [
    totalTour,
    totalTourByTourType,
    avgTourCost,
    totalTourByDivision,
    highestBookedTour,
  ] = await Promise.all([
    totalTourPromise,
    totalTourByTourTypePromise,
    avgTourCostPromise,
    totalTourByDivisionPromise,
    highestBookedTourPromise,
  ]);

  return {
    totalTour,
    totalTourByTourType,
    avgTourCost,
    totalTourByDivision,
    highestBookedTour,
  };
};

const getBookingStats = async () => {
  const totalBookingPromise = Booking.countDocuments();

  const totalBookingByStatusPromise = Booking.aggregate([
    // stage-1: Group bookings by status and count total bookings in each status
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);

  const bookingsPerTourPromise = Booking.aggregate([
    // stage-1: Group the bookings by tour and count total bookings in each tour
    {
      $group: {
        _id: "$tour",
        bookingCount: { $sum: 1 },
      },
    },
    // Stage-2 Sorting stage
    {
      $sort: { bookingCount: -1 },
    },
    // stage-3 : Limit the result to 10
    {
      $limit: 10,
    },
    // stage-4: Lookup to get the tour details
    {
      $lookup: {
        from: "tours", // collection name
        localField: "_id",
        foreignField: "_id",
        as: "tourDetails",
      },
    },
    // stage-5: Unwind the tourDetails array to -> Object
    {
      $unwind: "$tourDetails",
    },
    {
      $project: {
        bookingCount: 1,
        "tourDetails.title": 1,
        "tourDetails.slug": 1,
        "tourDetails.costFrom": 1,
      },
    },
  ]);

  const avgGuestCountPerBookingPromise = Booking.aggregate([
    // stage-1: Group the bookings and calculate the average guest count
    {
      $group: {
        _id: null,
        avgGuestCount: { $avg: "$guestCount" },
      },
    },
  ]);

  const bookingLast7DaysPromise = Booking.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  const bookingLast30DaysPromise = Booking.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const totalBookingByUniqueUsersPromise = Booking.distinct("user").then(
    (user: any) => user.length
  );

  const [
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking,
    bookingLast7Days,
    bookingLast30Days,
    totalBookingByUniqueUsers,
  ] = await Promise.all([
    totalBookingPromise,
    totalBookingByStatusPromise,
    bookingsPerTourPromise,
    avgGuestCountPerBookingPromise,
    bookingLast7DaysPromise,
    bookingLast30DaysPromise,
    totalBookingByUniqueUsersPromise,
  ]);
  return {
    totalBooking,
    totalBookingByStatus,
    bookingsPerTour,
    avgGuestCountPerBooking: avgGuestCountPerBooking[0].avgGuestCount,
    bookingLast7Days,
    bookingLast30Days,
    totalBookingByUniqueUsers,
  };
};

const getPaymentStats = async () => {
  const totalPaymentPromise = Payment.countDocuments();

  const totalPaymentByStatusPromise = Payment.aggregate([
    // stage-1: Group payments by status and count total payments in each status
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 },
      },
    },
  ]);

  const totalRevenuePromise = Payment.aggregate([
    // stage-1: match payments by paid status and count total payments in each status
    {
      $match: { status: PAYMENT_STATUS.PAID },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  const avgPaymentAmountPromise = Payment.aggregate([
    // stage-1: Group the payments and calculate the average payment amount
    {
      $group: {
        _id: null,
        avgPaymentAmount: { $avg: "$amount" },
      },
    },
  ]);

  const paymentGatewayDataPromise = Payment.aggregate([
    // stage-1: Group payments by gateway and count total payments in each gateway
    {
      $group: {
        _id: { $ifNull: ["$paymentGatewayData.status", "Unknown"] },
        total: { $sum: 1 },
      },
    },
  ]);

  const [
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount,
    paymentGatewayData,
  ] = await Promise.all([
    totalPaymentPromise,
    totalPaymentByStatusPromise,
    totalRevenuePromise,
    avgPaymentAmountPromise,
    paymentGatewayDataPromise,
  ]);

  return {
    totalPayment,
    totalPaymentByStatus,
    totalRevenue,
    avgPaymentAmount: avgPaymentAmount[0].avgPaymentAmount,
    paymentGatewayData,
  };
};

export const StatsService = {
  getPaymentStats,
  getBookingStats,
  getTourStats,
  getUserStats,
};
