const cloudinary = require("cloudinary").v2;
const { extractPublicId } = require('cloudinary-build-url')

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadFile = async (file) => {
    try {
        // const { mimetype } = file;
        // const img = mimetype.split("/");
        // let extension = img[1].toLowerCase();

        // if (!['jpeg', 'jpg', 'png'].includes(extension)) {
        //     return res.status(400).json({ message: `${extension} is not allowed..`, errorCode: 30002 });
        // }

        const base64String = file.buffer.toString('base64');

        const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64String}`, {
            folder: 'show-me-canada',
            resource_type: 'auto'
        });
        return result.secure_url;

    } catch (error) {
        console.log("uploadFile ~ error:", error)
        return { status: 500, success: false, message: error.message };
    }
};

const deleteImage = async (cloudinaryUrl) => {
    try {

        const publicId = extractPublicId(cloudinaryUrl)
        const result = await cloudinary.uploader.destroy(publicId);

        return { status: 200, success: true, message: 'Image deleted successfully' };
    } catch (error) {
        console.log("deleteImage ~ error:", error);
        return { status: 500, success: false, message: error.message };
    }
};
module.exports = { uploadFile, deleteImage };