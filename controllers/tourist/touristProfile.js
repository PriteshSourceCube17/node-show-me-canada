const { default: mongoose } = require("mongoose");
const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, City, Language, Activity, Hour, Notification, Tourist } = require("../../models");
const multer = require("multer");
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const storage = multer.memoryStorage();
const upload = multer({ storage });

// update profile
const updateGeneralInfo = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.fields([
        { name: 'username', maxCount: 1 },
        { name: 'email', maxCount: 1 },
        { name: 'location', maxCount: 1 },
        { name: 'languages', maxCount: 1 },
        { name: 'aboutMe', maxCount: 1 },
        { name: 'images', maxCount: 5 }
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");

            const { username, email, location, languages, aboutMe } = req.body;
            const user = await User.findById(id)
            let tourist = await Tourist.findOne({ userId: id })

            if (email) {
                const isExits = await User.findOne({ email, _id: { $ne: id }, isDeleted: 0 })
                if (isExits) return response400(res, "Email is already exits.")

                user.email = email
            }

            // image uploading
            if (req?.files?.images) {
                const files = req.files.images;
                await Promise.all(files.map(async file => {
                    const result = await uploadFile(file)
                    tourist.images.push({ url: result })
                }))
            }
            // validate location
            if (location) {
                if (!mongoose.Types.ObjectId.isValid(location)) return response400(res, "Please enter valid location id")
                const locationDetails = await City.findOne({ _id: location, isDeleted: 0 })
                if (!locationDetails) return response400(res, "Location details not found.")

                tourist.location = location
            }

            // validate languages
            if (languages) {
                for (const val of languages) {
                    if (!mongoose.Types.ObjectId.isValid(val)) return response400(res, "Please enter valid language id")
                    const languageDetails = await Language.findOne({ _id: val, isDeleted: 0 })
                    if (!languageDetails) return response400(res, "Language details not found.")
                }
                tourist.languages = languages
            }


            user.username = username || "";
            tourist.aboutMe = aboutMe

            await user.save()
            await tourist.save()

            return response200(res, "Update successfully.", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})

//update other info
const updateNotificationInfo = catchAsyncError(async (req, res) => {
    let userId = req.user

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    await Notification.updateOne({ userId: userId }, req.body)
    return response200(res, "Update successfully.", true, [])
})

// get notification info
const notificationInfo = catchAsyncError(async (req, res) => {
    let userId = req.user

    const data = await Notification.findOne({ userId }).select(" _id email mobile")
    return response200(res, "Notification data fetch successfully.", true, data)
})

// primary image
const primaryImage = catchAsyncError(async (req, res) => {
    let userId = req.user
    const { imageId, isPrimary } = req.body;
    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(imageId)) return response400(res, "Please enter valid imageId")

    const data = await Tourist.findOneAndUpdate(
        { userId: userId, 'images._id': imageId },
        { $set: { 'images.$.primary': isPrimary } }
    );
    if (!data) return response400(res, "Image details not found")

    return response200(res, "Update successfully.", true, [])
})

// mobile number verification code
const sendMobileVerification = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { mobileNumber } = req.body
    if (!mobileNumber) return response200(res, "mobileNumber is required.")

    const tourist = await Tourist.findOne({ userId })

    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    tourist.mobileVerifyOtp = OTP
    tourist.mobileNumber = mobileNumber

    await tourist.save()
    return response200(res, "Verification code has been send.", true, OTP)
})

// verify OTP for reset Password
const verifyOTP = catchAsyncError(async (req, res) => {
    let userId = req.user
    const { OTP } = req.body;
    if (!OTP) return response400(res, "OTP is required.")

    const tourist = await Tourist.findOne({ userId: userId, mobileVerifyOtp: OTP });
    if (!tourist) return response400(res, "Invalid OTP.")

    tourist.mobileVerifyOtp = ''
    tourist.isMobileVerified = 1
    await tourist.save()
    return response200(res, "Verification done successfully.", true, [])
})

// delete single image
const deleteSingleImage = catchAsyncError(async (req, res) => {
    const id = req.user;
    const { imageId } = req.body;
    if (!imageId) return response400(res, "imageId is required.")

    const user = await Tourist.findOne({ userId: id });
    if (!user) return response400(res, "User not found.");

    // Find the image 
    const imageIndex = user.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) return response400(res, "Image not found.");
    const imageUrl = user.images[imageIndex].url;

    // remove the image from the user's data
    user.images.splice(imageIndex, 1);
    await user.save();

    await deleteImage(imageUrl)

    return response200(res, "Image deleted successfully.", true, []);
})

// get my profile
const getProfile = catchAsyncError(async (req, res) => {
    let userId = req.user

    const data = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId), role: "tourist" } },
        {
            $lookup: {
                from: "tourists",
                localField: "_id",
                foreignField: "userId",
                as: "tourist",
                pipeline: [
                    {
                        $lookup: {
                            from: "languages",
                            localField: "languages",
                            foreignField: "_id",
                            as: "languages",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "cities",
                            localField: "location",
                            foreignField: "_id",
                            as: "location",
                            pipeline: [
                                { $project: { _id: 1, name: 1, coverImage: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$location",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project:
                        {
                            _id: 1,
                            isMobileVerified: 1,
                            languages: 1,
                            images: 1,
                            aboutMe: 1,
                            location: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
                        }
                    }

                ]
            },
        },
        {
            $unwind: {
                path: "$tourist",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                email: 1,
                role: 1,
                rating: 1,
                noOfReviews: 1,
                isTourGuide: 1,
                tourist: 1,
            }
        }
    ])
    return response200(res, "Profile details fetch successfully.", true, data)
})

// get single details by id
const getDetails = catchAsyncError(async (req, res) => {
    const { userId } = req.params;

    const data = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId), role: "tourist" } },
        {
            $lookup: {
                from: "tourists",
                localField: "_id",
                foreignField: "userId",
                as: "tourist",
                pipeline: [
                    {
                        $lookup: {
                            from: "languages",
                            localField: "languages",
                            foreignField: "_id",
                            as: "languages",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "cities",
                            localField: "location",
                            foreignField: "_id",
                            as: "location",
                            pipeline: [
                                { $project: { _id: 1, name: 1, coverImage: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$location",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project:
                        {
                            _id: 1,
                            isMobileVerified: 1,
                            languages: 1,
                            images: 1,
                            aboutMe: 1,
                            location: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
                        }
                    }

                ]
            },
        },
        {
            $unwind: {
                path: "$tourist",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                email: 1,
                role: 1,
                isTourGuide: 1,
                tourist: 1,
            }
        }
    ])
    if (data.length) {
        return response200(res, "Tourist details fetch successfully.", true, data)
    } else {
        return response400(res, "Tourist details not found.")
    }

})
module.exports = {
    updateGeneralInfo,
    updateNotificationInfo,
    notificationInfo,
    primaryImage,
    sendMobileVerification,
    verifyOTP,
    deleteSingleImage,
    getProfile,
    getDetails
}