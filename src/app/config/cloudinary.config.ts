/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";
import httpstatus from "http-status-codes"

cloudinary.config({
    cloud_name: envVars.CLOUDINARY.CLOUDINARY_CLOUD_NAME,
    api_key: envVars.CLOUDINARY.CLOUDINARY_API_KEY,
    api_secret: envVars.CLOUDINARY.CLOUDINARY_API_SECRET,
});

// Function to delete an image from Cloudinary by destroy api
export const deleteImageFromCloudinary = async (imgUrl: string) => {
   try {
     // https://res.cloudinary.com/dbknbnlb0/image/upload/v1753288037/pptw4t6b8l7-1753288035965-images-jpeg.jpeg.jpg
     const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
     const match = imgUrl.match(regex);

     if (match && match[1]) {
       const publicId = match[1];
       await cloudinary.uploader.destroy(publicId);
       console.log(`Image with public ID ${publicId} deleted successfully.`);
     }
   } catch (error: any) {
     throw new AppError(httpstatus.BAD_REQUEST,"Error deleting image from Cloudinary:", error.message);
   }

};

export const cloudinaryUpload = cloudinary;


// const uploadToCloudinary = cloudinary.uploader.upload()