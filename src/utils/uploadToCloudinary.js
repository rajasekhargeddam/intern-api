const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder = "profile-images") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;