import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";

const createUser = async (payload: Partial<IUser>) => { 
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User already exists with this email"
    );
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUNDS)
  );

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email as string, // Using email as providerId for credentials
  };

  const user = await User.create({
    ...rest,
    email,
    password: hashedPassword,
    auths: [authProvider],
  });
  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {

  // Check if the user is trying to update their own profile
  if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) { 
    if (userId !== decodedToken._id) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to perform this action"
      );
    }
  }

  // Check if the user exists
  const ifUserExist = await User.findById(userId);
  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found with this id");
  }


  if (decodedToken.role === Role.ADMIN && ifUserExist.role === Role.SUPER_ADMIN) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to assign super admin role"
    );
    
  }

  /**
   * email - can not be updated
   * password - re hash it
   * role, isDeleted - only super admin can update this
   * name, phone, address
   */

  if (payload.role) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to perform this action"
      );
    }

    // if (payload.role === Role.SUPER_ADMIN && decodedToken.role === Role.ADMIN) {
    //   throw new AppError(
    //     httpStatus.FORBIDDEN,
    //     "You are not authorized to assign super admin role"
    //   );
    // }
  }

  if (payload.isActive || payload.isDeleted || payload.isVerified) {
    if (decodedToken.role === Role.USER || decodedToken.role === Role.GUIDE) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not authorized to update this field"
      );
    }
  }

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
   const queryBuilder = new QueryBuilder(User.find(), query);
   const usersData = queryBuilder
     .filter()
     .search(userSearchableFields)
     .sort()
     .fields()
     .paginate();

   const [data, meta] = await Promise.all([
     usersData.build(),
     queryBuilder.getMeta(),
   ]);

   return {
     data,
     meta,
   };
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId).select("-password");
  return {
    data: user,
  };
};

const getSingleUser = async (id: string) => {
  const user = await User.findById(id).select("-password");
  return {
    data: user,
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  updateUser,
  getMe,
  getSingleUser
};
