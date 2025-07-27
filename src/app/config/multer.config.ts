import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary.config";

const storage = new CloudinaryStorage({
  cloudinary: cloudinaryUpload,
  params: {
    public_id: (req, file) => {
      // my image.png will be uploaded as my-image.png
      const fileName = file.originalname
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/\./g, "-")
        .replace(/[^a-z0-9\-.]/g, ""); // non alphanumeric characters

      const extension = file.originalname.split(".").pop();
      const uniqueFileName =
        Math.random().toString(36).substring(2) +
        "-" +
        Date.now() +
        "-" +
        fileName +
        "." +
        extension;
      return uniqueFileName;
    },
  },
});

export const multerUpload = multer({ storage: storage });
