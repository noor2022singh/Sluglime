const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sluglime/posts",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sluglime/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [
      { width: 200, height: 200, crop: "fill", gravity: "face" },
    ],
  },
});

const chatImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sluglime/chat-images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 600, height: 600, crop: "limit" }],
  },
});

const communityStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sluglime/communities",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});

const uploadPost = multer({ storage: postStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadChatImage = multer({ storage: chatImageStorage });
const uploadCommunity = multer({ storage: communityStorage });

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

const getImageUrl = (cloudinaryResponse) => {
  return cloudinaryResponse.secure_url || cloudinaryResponse.url;
};

module.exports = {
  cloudinary,
  uploadPost,
  uploadAvatar,
  uploadChatImage,
  uploadCommunity,
  deleteImage,
  getImageUrl,
};
