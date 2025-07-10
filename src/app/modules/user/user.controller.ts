import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { get } from "http";
import { sendResponse } from "../../utils/sendResponse";

// CreateUser with CatchAsync utility function
const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);
    // res.status(httpStatus.CREATED).json({
    //   message: "User created successfully",
    //   user,
    // });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User created successfully",
      data: user,
      
    });
  }
);

// const createUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const user = await UserServices.createUser(req.body);

//     res.status(httpStatus.CREATED).json({
//       message: "User created successfully",
//       user,
//     });
//   } catch (error: any) {
//     console.error("Error creating user:", error);
//     next(error); // Pass the error to the global error handler
//   }
// };

//  const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
//    try {
//      const users = await UserServices.getAllUsers();
//      res.status(httpStatus.OK).json({
//        success: true,
//        message: "All users retrieved successfully",
//        users,
//      });
//    } catch (error: any) {
//      console.error("Error retrieving users:", error);
//      next(error);
//    }
//  };

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await UserServices.getAllUsers();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All users retrieved successfully",
      data: result.data,
      meta: result.meta
    });
  }
);

export const userControllers = {
  createUser,
  getAllUsers,
};

// Step-1 Route matching >> Step-2 Controller matching >>>
// Step-3 Service >>> Step-4 Model >> Step-5 Database

// Create SERVICE first > then  Create CONTROLLER and so on
