const { default: mongoose } = require("mongoose");
const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, TourGuide, City, Language, Activity, Hour, Notification, Tourist, Subscription, UserSubscriptionPlan } = require("../../models");
const multer = require("multer");
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const storage = multer.memoryStorage();
const upload = multer({ storage });

//function for check tour guide fill all details or not
const isTourGuideEligible = async (userId) => {
    const data = await TourGuide.findOne({ userId });
    const { isWantToShowFree, hourlyRate, duration, gender, location, languages, activities, aboutMe, motto, willShowYou, images, mobileNumber, isMobileVerified } = data

    if (
        // ((isWantToShowFree === true && hourlyRate && hourlyRate.rate === 0) ||
        //     (isWantToShowFree === false && hourlyRate && hourlyRate.currency !== "" && hourlyRate.rate !== 0)) &&
        // (duration && duration !== "") &&
        (gender && gender !== "") &&
        (location && location !== "") &&
        (languages && languages.length) &&
        (activities && activities.length) &&
        (aboutMe && aboutMe !== "") &&
        (motto && motto !== "") &&
        (willShowYou && willShowYou !== "") &&
        (images && images.length) &&
        (mobileNumber && mobileNumber !== "")
        // && isMobileVerified === 1
    ) {
        await User.updateOne({ _id: userId }, { $set: { isTourGuide: true } })
    } else {
        await User.updateOne({ _id: userId }, { $set: { isTourGuide: false } })
    }
}

// update profile
const updateGeneralInfo = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.fields([
        { name: 'username', maxCount: 1 },
        { name: 'email', maxCount: 1 },
        { name: 'mobileNumber', maxCount: 1 },
        { name: 'images' },
        { name: 'bannerImages' },
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");

            const { username, email, mobileNumber } = req.body;
            const user = await User.findById(id)
            let tourGuide = await TourGuide.findOne({ userId: id })

            if (email) {
                const isExits = await User.findOne({ email, _id: { $ne: id }, isDeleted: 0 })
                if (isExits) return response400(res, "Email is already exits.")

                user.email = email
            }

            if (mobileNumber) {
                const isTourGuideNumber = await TourGuide.findOne({ mobileNumber, isDeleted: 0, userId: { $ne: id } });
                const isTouristNumber = await Tourist.findOne({ mobileNumber, isDeleted: 0, userId: { $ne: id } });
                if (isTourGuideNumber || isTouristNumber) return response400(res, "Mobile number already registered. Please use another.")

                tourGuide.mobileNumber = mobileNumber
            }

            const images = []
            const bannerImage = []
            // check subscription plan limit
            if (req?.files?.images || req?.files?.bannerImages) {
                const subscription = await UserSubscriptionPlan.findOne({ userId: id, isDeleted: 0, status: 1 })
                if (!subscription) return response400(res, "Please select subscription plan")

                if (req?.files?.images) {
                    const exitingImages = tourGuide?.images ? tourGuide.images.length : 0;

                    if (exitingImages < subscription?.noOfProfileImage) {
                        const files = req.files.images;
                        await Promise.all(files.map(async file => {
                            const result = await uploadFile(file)
                            images.push({ url: result })
                        }))
                    } else {
                        return response400(res, "Oops! You've reached your maximum limit for profile images. Upgrade your subscription to upload more dazzling photos!");
                    }
                }

                // banner image uploading
                if (req?.files?.bannerImages) {
                    const exitingBannerImgCount = tourGuide?.bannerImages ? tourGuide.bannerImages.length : 0;

                    if (exitingBannerImgCount < subscription?.noOfCoverImage) {
                        const files = req.files.bannerImages;
                        await Promise.all(files.map(async file => {
                            const result = await uploadFile(file)
                            bannerImage.push({ url: result })
                        }))
                    } else {
                        return response400(res, "Oops! You've reached your maximum limit for banner images. Choose wisely or upgrade for more slots!");
                    }
                }
            }

            // gallery image
            const galleryImage = []
            if (req?.files?.galleryImages) {
                const files = req.files.galleryImages;
                await Promise.all(files.map(async file => {
                    const result = await uploadFile(file)
                    galleryImage.push({ url: result })
                }))

            }

            user.username = username || "";
            await user.save()

            tourGuide.images.push(...images)
            tourGuide.bannerImages.push(...bannerImage)
            tourGuide.galleryImages.push(...galleryImage)
            await tourGuide.save()

            // if all details fill make isTourGuide true
            await isTourGuideEligible(id)

            return response200(res, "Update successfully.", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})


// upload gallery image
const uploadGalleryImage = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.fields([
        { name: 'galleryImages' },
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");

            let tourGuide = await TourGuide.findOne({ userId: id })

            // gallery image
            const galleryImage = []
            if (req?.files?.galleryImages) {
                const files = req.files.galleryImages;
                await Promise.all(files.map(async file => {
                    const result = await uploadFile(file)
                    galleryImage.push({ url: result })
                }))

            }

            tourGuide.galleryImages.push(...galleryImage)
            await tourGuide.save()
            return response200(res, "Added successfully.", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})

// upload gallery video
const uploadGalleryVideo = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.any()(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");
            console.log('file', req.files);
            console.log('body', req.body);

            let tourGuide = await TourGuide.findOne({ userId: id })

            if (!req?.files.length) return response400(res, "Thumbnail is required.")

            req.body.galleryVideos = await Promise.all(
                req.files.map(async (val, index) => {
                    const link = req.body.galleryVideo[index].link
                    const thumbnail = await uploadFile(val);
                    return { link: link, thumbnail: thumbnail };
                })
            );
            tourGuide.galleryVideo.push(...req.body.galleryVideos)
            await tourGuide.save()
            return response200(res, "Added successfully.", true, []);


        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})

//update other info
const updateOtherInfo = catchAsyncError(async (req, res) => {
    let userId = req.user
    const { isWantToShowFree, hourlyRate, duration, gender, location, languages, activities, aboutMe, motto, willShowYou } = req.body

    const userData = await TourGuide.findOne({ userId })

    // validate location
    if (location) {
        if (!mongoose.Types.ObjectId.isValid(location)) return response400(res, "Please enter valid location id")
        const locationDetails = await City.findOne({ _id: location, isDeleted: 0 })
        if (!locationDetails) return response400(res, "Location details not found.")

        userData.location = location
    }

    // validate languages
    if (languages) {
        for (const val of languages) {
            if (!mongoose.Types.ObjectId.isValid(val)) return response400(res, "Please enter valid language id")
            const languageDetails = await Language.findOne({ _id: val, isDeleted: 0 })
            if (!languageDetails) return response400(res, "Language details not found.")
        }
        userData.languages = languages
    }

    // validate activities
    if (activities) {
        for (const val of activities) {
            if (!mongoose.Types.ObjectId.isValid(val)) return response400(res, "Please enter valid activity id")
            const languageDetails = await Activity.findOne({ _id: val, isDeleted: 0 })
            if (!languageDetails) return response400(res, "Activity details not found.")
        }
        userData.activities = activities
    }

    // validate duration
    if (duration) {
        if (!mongoose.Types.ObjectId.isValid(duration)) return response400(res, "Please enter valid duration id")
        const durationDetails = await Hour.findOne({ _id: duration, isDeleted: 0 })
        if (!durationDetails) return response400(res, "Duration details not found.")
        userData.duration = duration
    }

    // if (isWantToShowFree === true) {
    //     userData.hourlyRate.rate = 0
    // } else {
    //     userData.hourlyRate = hourlyRate
    // }

    userData.isWantToShowFree = isWantToShowFree
    userData.gender = gender
    userData.aboutMe = aboutMe
    userData.willShowYou = willShowYou
    userData.motto = motto
    await userData.save()

    // if all details fill make isTourGuide true
    await isTourGuideEligible(userId)
    return response200(res, "Update successfully.", true, [])
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

    const data = await TourGuide.findOneAndUpdate(
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

    const tourGuide = await TourGuide.findOne({ userId })

    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    tourGuide.mobileVerifyOtp = OTP
    tourGuide.mobileNumber = mobileNumber

    await tourGuide.save()
    return response200(res, "Verification code has been send.", true, OTP)
})

// verify OTP for reset Password
const verifyOTP = catchAsyncError(async (req, res) => {
    let userId = req.user
    const { OTP } = req.body;
    if (!OTP) return response400(res, "OTP is required.")

    const tourGuide = await TourGuide.findOne({ userId: userId, mobileVerifyOtp: OTP });
    if (!tourGuide) return response400(res, "Invalid OTP.")

    tourGuide.mobileVerifyOtp = ''
    tourGuide.isMobileVerified = 1
    await tourGuide.save()
    await isTourGuideEligible(userId)
    return response200(res, "Verification done successfully.", true, [])
})

// get my profile
const getProfile = catchAsyncError(async (req, res) => {
    let userId = req.user

    const data = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId), role: "tour-guide" } },
        {
            $lookup: {
                from: "tourguides",
                localField: "_id",
                foreignField: "userId",
                as: "tourGuide",
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
                            from: "activities",
                            localField: "activities",
                            foreignField: "_id",
                            as: "activities",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]

                        }
                    },
                    {
                        $lookup: {
                            from: "hours",
                            localField: "duration",
                            foreignField: "_id",
                            as: "duration",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$duration",
                            preserveNullAndEmptyArrays: true
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
                            isWantToShowFree: 1,
                            hourlyRate: 1,
                            languages: 1,
                            activities: 1,
                            images: 1,
                            bannerImages: 1,
                            aboutMe: 1,
                            duration: 1,
                            galleryImages: 1,
                            galleryVideo: 1,
                            gender: 1,
                            location: 1,
                            bannerImages: 1,
                            motto: 1,
                            willShowYou: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
                        }
                    }

                ]
            },
        },
        {
            $unwind: {
                path: "$tourGuide",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "receiverId",
                as: "reviews",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "reviewerId",
                            foreignField: "_id",
                            as: "reviewer",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $unwind: "$reviewer"
                    },
                    {
                        $project: {
                            _id: 1,
                            bookingId: 1,
                            review: 1,
                            rating: 1,
                            createdAt: 1,
                            reviewer: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "usersubscriptionplans",
                localField: "_id",
                foreignField: "userId",
                as: "subscriptionPlan",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    { $sort: { purchaseDate: -1 } },
                    {
                        $project: { _id: 1, subscriptionId: 1, title: 1, noOfProfileImage: 1, noOfCoverImage: 1, noOfTourPackage: 1, duration: 1, amount: 1, type: 1, purchaseDate: 1, expiredDate: 1, status: 1, description: 1, isExpired: 1 }
                    }
                ]
            }
        },
        // {
        //     $unwind: {
        //         path: "$subscriptionPlan",
        //         preserveNullAndEmptyArrays: true
        //     }
        // },
        {
            $lookup: {
                from: "tourpackages",
                localField: "_id",
                foreignField: "tourGuide",
                as: "tourPackage",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    { $sort: { createdAt: -1 } },
                    {
                        $lookup: {
                            from: "cities",
                            localField: "locationId",
                            foreignField: "_id",
                            as: "location",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$location",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    { $project: { _id: 1, title: 1, description: 1, location: 1, galleryImages: 1, price: 1, status: 1 } }
                ]
            }
        },
        {
            $lookup: {
                from: "tourpackages",
                localField: "_id",
                foreignField: "tourGuide",
                as: "minPrice",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    {
                        $group: {
                            _id: null,
                            minPrice: { $min: "$price" }
                        }
                    }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                email: 1,
                role: 1,
                isTourGuide: 1,
                rating: 1,
                noOfReviews: 1,
                tourGuide: 1,
                reviews: 1,
                subscriptionPlan: 1,
                tourPackage: 1,
                priceStartFrom: { $arrayElemAt: ["$minPrice.minPrice", 0] }
            }
        }
    ])
    return response200(res, "Profile details fetch successfully.", true, data)
})

// delete single image
const deleteSingleImage = catchAsyncError(async (req, res) => {
    const id = req.user;
    const { imageId } = req.body;
    if (!imageId) return response400(res, "imageId is required.")

    const user = await TourGuide.findOne({ userId: id });
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

// delete single banner image
const deleteBannerImage = catchAsyncError(async (req, res) => {
    const id = req.user;
    const { bannerImageId } = req.body;
    if (!bannerImageId) return response400(res, "bannerImageId is required.")

    const user = await TourGuide.findOne({ userId: id });
    if (!user) return response400(res, "User not found.");

    // Find the image 
    const imageIndex = user.bannerImages.findIndex(img => img._id.toString() === bannerImageId);
    if (imageIndex === -1) return response400(res, "Banner image not found.");
    const imageUrl = user.bannerImages[imageIndex].url;

    // remove the image from the user's data
    user.bannerImages.splice(imageIndex, 1);
    await user.save();

    await deleteImage(imageUrl)

    return response200(res, "Banner image deleted successfully.", true, []);
})

// delete single gallery image
const deleteGalleryImage = catchAsyncError(async (req, res) => {
    const id = req.user;
    const { imageId } = req.body;
    if (!imageId) return response400(res, "imageId is required.")

    const user = await TourGuide.findOne({ userId: id });
    if (!user) return response400(res, "User not found.");

    // Find the image 
    const imageIndex = user.galleryImages.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) return response400(res, "Image not found.");
    const imageUrl = user.galleryImages[imageIndex].url;

    // remove the image from the user's data
    user.galleryImages.splice(imageIndex, 1);
    await user.save();

    await deleteImage(imageUrl)

    return response200(res, "Image deleted successfully.", true, []);
})

// delete single gallery video
const deleteGalleryVideo = catchAsyncError(async (req, res) => {
    const id = req.user;
    const { imageId } = req.body;
    if (!imageId) return response400(res, "imageId is required.")

    const user = await TourGuide.findOne({ userId: id });
    if (!user) return response400(res, "User not found.");

    // Find the image 
    const imageIndex = user.galleryVideo.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) return response400(res, "Image not found.");
    const imageUrl = user.galleryVideo[imageIndex].thumbnail;

    // remove the image from the user's data
    user.galleryVideo.splice(imageIndex, 1);
    await user.save();

    await deleteImage(imageUrl)

    return response200(res, "Image deleted successfully.", true, []);
})

// get single details by id
const getDetails = catchAsyncError(async (req, res) => {
    const { userId } = req.params;

    const data = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId), role: "tour-guide", isDeleted: 0, isTourGuide: true, status: 1 } },
        {
            $lookup: {
                from: "tourguides",
                localField: "_id",
                foreignField: "userId",
                as: "tourGuide",
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
                            from: "activities",
                            localField: "activities",
                            foreignField: "_id",
                            as: "activities",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]

                        }
                    },
                    {
                        $lookup: {
                            from: "hours",
                            localField: "duration",
                            foreignField: "_id",
                            as: "duration",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$duration",
                            preserveNullAndEmptyArrays: true
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
                            isWantToShowFree: 1,
                            hourlyRate: 1,
                            languages: 1,
                            activities: 1,
                            images: 1,
                            aboutMe: 1,
                            duration: 1,
                            gender: 1,
                            location: 1,
                            bannerImages: 1,
                            galleryImages: 1,
                            galleryVideo: 1,
                            motto: 1,
                            willShowYou: 1,
                            mobileNumber: 1
                        }
                    }

                ]
            },
        },
        {
            $unwind: {
                path: "$tourGuide",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "receiverId",
                as: "reviews",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "reviewerId",
                            foreignField: "_id",
                            as: "reviewer",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $unwind: "$reviewer"
                    },
                    {
                        $project: {
                            _id: 1,
                            bookingId: 1,
                            review: 1,
                            rating: 1,
                            createdAt: 1,
                            reviewer: 1,
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "tourpackages",
                localField: "_id",
                foreignField: "tourGuide",
                as: "tourPackage",
                pipeline: [
                    { $match: { isDeleted: 0, status: 1 } },
                    { $sort: { createdAt: -1 } },
                    {
                        $lookup: {
                            from: "cities",
                            localField: "locationId",
                            foreignField: "_id",
                            as: "location",
                            pipeline: [
                                { $project: { _id: 1, name: 1 } }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$location",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    { $project: { _id: 1, title: 1, description: 1, location: 1, galleryImages: 1, price: 1, status: 1, duration: 1 } }
                ]
            }
        },
        {
            $lookup: {
                from: "tourpackages",
                localField: "_id",
                foreignField: "tourGuide",
                as: "minPrice",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    {
                        $group: {
                            _id: null,
                            minPrice: { $min: "$price" }
                        }
                    }
                ]
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
                tourGuide: 1,
                reviews: 1,
                tourPackage: 1,
                priceStartFrom: {
                    $cond: {
                        if: { $eq: [{ $size: "$minPrice" }, 0] },
                        then: 0,
                        else: { $arrayElemAt: ["$minPrice.minPrice", 0] }
                    }
                }
            }
        }
    ])

    return data.length ? response200(res, "Tour guide data fetch successfully.", true, data) : response400(res, "Tour guide details not found.");

})

// get all tour guide with filter
const getAllTourGuide = catchAsyncError(async (req, res) => {
    const id = req.user
    const { limit, offset, cityId, activities, gender, languages, priceFrom, priceTo, search } = req.body;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const query = { isDeleted: 0, status: 1, isTourGuide: true, _id: { $ne: new mongoose.Types.ObjectId(id) } };
    const subQuery = { isDeleted: 0 }

    if (search) {
        subQuery["location.name"] = { $regex: search, $options: 'i' }
    }

    if (cityId) {
        subQuery["location._id"] = new mongoose.Types.ObjectId(cityId);
    }

    if (activities && activities.length) {
        const activityIds = activities.map(activity => new mongoose.Types.ObjectId(activity));
        subQuery.activities = { $in: activityIds };
    }

    if (languages && languages.length) {
        const languageIds = languages.map(language => new mongoose.Types.ObjectId(language));
        subQuery.languages = { $in: languageIds };
    }

    if (gender && gender.length) {
        subQuery.gender = { $in: gender };
    }

    if (priceFrom !== "" && priceTo !== "") {
        subQuery["hourlyRate.rate"] = { $gte: priceFrom, $lte: priceTo }
    }

    let data = await User.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "tourguides",
                localField: "_id",
                foreignField: "userId",
                as: "tourGuide",
                pipeline: [
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
                    { $match: subQuery },
                    {
                        $project:
                        {
                            _id: 1,
                            isWantToShowFree: 1,
                            hourlyRate: 1,
                            images: 1,
                            location: 1,
                        }
                    }

                ]
            },
        },
        {
            $unwind: {
                path: "$tourGuide",
                // preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                role: 1,
                isTourGuide: 1,
                tourGuide: 1,
                rating: 1,
                noOfReviews: 1
            }
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 },
                result: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                totalCount: 1,
                data: { $slice: ['$result', offsetData, limitData] }
            }
        }

    ])
    return response200(res, "Tour guide list loaded successfully", true, data[0]);

});


module.exports = {
    updateGeneralInfo,
    sendMobileVerification,
    verifyOTP,
    primaryImage,
    getProfile,
    updateOtherInfo,
    deleteSingleImage,
    updateNotificationInfo,
    notificationInfo,
    deleteBannerImage,
    getDetails,
    getAllTourGuide,
    deleteGalleryImage,
    uploadGalleryImage,
    uploadGalleryVideo,
    deleteGalleryVideo
}