/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";
import httpstatus from "http-status-codes";
import stream from "stream";

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
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "Error deleting image from Cloudinary:",
      error.message
    );
  }
};

// Function to upload an image to Cloudinary
export const uploadPDFBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse | undefined> => {
  try {
    // Create a unique public ID for the PDF file
    return new Promise((resolve, reject) => {
      const public_id = `pdf/${fileName}-${Date.now()}`;
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      // Upload the buffer stream to Cloudinary

      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto", // Use 'auto' to automatically detect the resource type
            public_id: public_id,
            folder: "pdf", // Optional: specify a folder in Cloudinary
          },
          (error, result) => {
            if (error) {
              console.error("Error uploading PDF to Cloudinary:", error);
              return reject(error);
            } else {
              console.log("PDF uploaded successfully:", result);
              resolve(result);
            }
          }
        )
        .end(buffer);
    });
  } catch (error: any) {
    console.log(error);
    throw new AppError(
      httpstatus.BAD_REQUEST,
      "Error uploading file to Cloudinary:",
      error.message
    );
  }
};

export const cloudinaryUpload = cloudinary;

// const uploadToCloudinary = cloudinary.uploader.upload()
