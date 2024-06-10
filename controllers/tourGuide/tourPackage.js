const { default: mongoose } = require("mongoose");
const { response200, response400, response500 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, TourPackage, City, UserSubscriptionPlan, TouristBooking } = require("../../models");
const multer = require("multer");
const storage = multer.memoryStorage()
const upload = multer({ storage })
const { uploadFile, deleteImage } = require("../../lib/uploader/upload");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { addPackageValidation } = require("../../utils/validations/tourGuideValidation")

//add tour package
const addTourPackage = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.fields([
        { name: 'title', maxCount: 1 },
        { name: 'description', maxCount: 1 },
        { name: 'bannerImage', maxCount: 1 },
        { name: 'locationId', maxCount: 1 },
        { name: 'price', maxCount: 1 },
        { name: 'duration', maxCount: 1 },
        { name: 'galleryImages' }
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");

            const isTourGuide = await User.findOne({ _id: id, isTourGuide: true })
            if (!isTourGuide) return response400(res, "You're not yet listed as a tour guide. Complete your profile to unlock this feature")

            // check subscription package limitation
            const plan = await UserSubscriptionPlan.findOne({ userId: id, isDeleted: 0, status: 1 })
            if (!plan) return response400(res, "Please select subscription plan")
            const userPackages = await TourPackage.countDocuments({ tourGuide: id, isDeleted: 0 })

            if (userPackages < plan.noOfTourPackage) {
                const { title, locationId } = req.body;

                const validation = addPackageValidation?.filter(field => !req.body[field]);
                if (validation.length > 0) return response400(res, `${validation.join(', ')} is required`);

                let tourPackage = await TourPackage.findOne({ tourGuide: id, title, isDeleted: 0 })
                if (tourPackage) return response400(res, "The title for tour package is already in use.")

                if (locationId) {
                    if (!mongoose.Types.ObjectId.isValid(locationId)) return response400(res, "Please enter valid locationId.")
                    const location = await City.findOne({ _id: locationId, isDeleted: 0 })
                    if (!location) return response400(res, "location details not found.")
                }

                if (req?.files?.bannerImage) {
                    const file = req.files.bannerImage[0]
                    req.body.bannerImage = await uploadFile(file)
                }

                let galleryImage = []
                if (req?.files?.galleryImages) {
                    if (req?.files?.galleryImages.length > 3) return response400(res, "You can only upload a maximum three images for your gallery. Choose wisely!")
                    const files = req.files.galleryImages;
                    await Promise.all(files.map(async file => {
                        const result = await uploadFile(file)
                        galleryImage.push({ url: result })
                    }))
                }

                await TourPackage.create({ ...req.body, galleryImages: galleryImage, tourGuide: id, locationId })
                return response200(res, "Tour package added successfully.", true, []);
            } else {
                return response400(res, "Oops! Looks like you've reached your limit for tour packages. Time to upgrade your plan! 🚀")
            }

        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})

//update tour package
const updateTourPackage = catchAsyncError(async (req, res) => {
    const id = req.user;
    upload.fields([
        { name: 'packageId', maxCount: 1 },
        { name: 'title', maxCount: 1 },
        { name: 'description', maxCount: 1 },
        { name: 'bannerImage', maxCount: 1 },
        { name: 'price', maxCount: 1 },
        { name: 'duration', maxCount: 1 },
        { name: 'galleryImages' }
    ])(req, res, async (err) => {
        try {
            if (err) return response400(res, "Something went wrong");

            const isTourGuide = await User.findOne({ _id: id, isTourGuide: true })
            if (!isTourGuide) return response400(res, "You're not yet listed as a tour guide. Complete your profile to unlock this feature")

            const { title, packageId, description, price, duration } = req.body;
            if (!packageId) return response400(res, "packageId is required.")
            if (!mongoose.Types.ObjectId.isValid(packageId)) return response400(res, "Please enter valid packageId")

            let tourPackage = await TourPackage.findOne({ isDeleted: 0, _id: packageId, tourGuide: id })
            if (!tourPackage) return response400(res, "Tour package details not found.")

            if (title) {
                let isMatch = await TourPackage.findOne({ tourGuide: id, title: title, _id: { $ne: packageId }, isDeleted: 0 })
                if (isMatch) return response400(res, "The title for tour package is already in use.")
                tourPackage.title = title
            }

            const imgPath = tourPackage?.bannerImage
            if (req?.files?.bannerImage) {
                const file = req.files.bannerImage[0]
                tourPackage.bannerImage = await uploadFile(file)
                if (imgPath !== undefined) await deleteImage(imgPath)
            }

            let galleryImage = []
            if (req?.files?.galleryImages) {
                const files = req.files.galleryImages;
                const existingGalleryImage = tourPackage.galleryImages.length
                const newImage = files.length
                if ((existingGalleryImage + newImage) <= 3) {
                    await Promise.all(files.map(async file => {
                        const result = await uploadFile(file)
                        galleryImage.push({ url: result })
                    }))
                } else {
                    return response400(res, "You can only upload a maximum three images for your gallery. Choose wisely!")
                }
            }

            tourPackage.description = description ? description : tourPackage?.description
            tourPackage.price = price ? price : tourPackage?.price
            tourPackage.duration = duration ? duration : tourPackage?.duration
            tourPackage.galleryImages.push(...galleryImage)
            await tourPackage.save()

            return response200(res, "Tour package updated successfully.", true, []);
        } catch (error) {
            console.log('✌️error --->', error);
            response500(res, "Something went wrong")
        }
    });
})

// delete tour package
const deletePackage = catchAsyncError(async (req, res) => {
    const { packageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(packageId)) return response400(res, "Please enter valid packageId")

    const package = await TourPackage.findByIdAndUpdate({ _id: packageId }, { $set: { isDeleted: 1 } })
    if (!package) return response400(res, "Tour package not found.");

    return response200(res, "Tour package deleted successfully", true, []);
});

// get my  tour package
const getMyTourPackages = catchAsyncError(async (req, res) => {
    const id = req.user
    const data = await TourPackage.find({ tourGuide: id, isDeleted: 0 }).populate({ path: "locationId", select: "_id name" }).select("title description  galleryImages price duration status createdAt").sort({ createdAt: -1 })

    return response200(res, "Tour package fetch successfully", true, data);
});

// delete single gallery image
const deleteGalleryImage = catchAsyncError(async (req, res) => {
    const { packageId, galleryImageId } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    const package = await TourPackage.findOne({ _id: packageId });
    if (!package) return response400(res, "Tour package not found.");

    // Find the image 
    const imageIndex = package.galleryImages.findIndex(img => img._id.toString() === galleryImageId);
    if (imageIndex === -1) return response400(res, "Gallery image not found.");
    const imageUrl = package.galleryImages[imageIndex].url;

    // remove the image from the package's data
    package.galleryImages.splice(imageIndex, 1);
    await package.save();

    await deleteImage(imageUrl)

    return response200(res, "Gallery image deleted successfully.", true, []);
})

// get my  tour package
const getTourPackageDetails = catchAsyncError(async (req, res) => {
    const { packageId } = req.params
    const data = await TourPackage.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(packageId), status: 1, isDeleted: 0 } },
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
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "packageId",
                as: "review",
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
            $project: {
                _id: 1,
                tourGuide: 1,
                title: 1,
                description: 1,
                galleryImages: 1,
                duration: 1,
                price: 1,
                status: 1,
                createdAt: 1,
                location: 1,
                review: 1
            }
        }
    ])

    return response200(res, "Tour package details fetch successfully", true, data);
});

// get my package booking request
const getBookingRequest = catchAsyncError(async (req, res) => {
    const id = req.user
    const { status, search, limit, offset } = req.body
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    const subQuery = {}
    const query = { tourGuideId: new mongoose.Types.ObjectId(id), isDeleted: 0 }
    if (status) {
        query.status = status
    }

    if (search) {
        subQuery.$or = [
            { "location.name": { $regex: search, $options: "i" } },
            { "tourist.username": { $regex: search, $options: "i" } }
        ]
    }

    let data = await TouristBooking.aggregate([
        { $match: query },
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
        {
            $lookup: {
                from: "users",
                localField: "touristId",
                foreignField: "_id",
                as: "tourist",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "details",
                            pipeline: [
                                {
                                    $project:
                                    {
                                        _id: 1,
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$details"
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            aboutMe: 1,
                            duration: 1,
                            location: 1,
                            details: 1
                        }
                    }
                ]
            }

        },
        {
            $unwind: {
                path: "$tourist",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: subQuery },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                packageId: 1,
                title: 1,
                description: 1,
                location: 1,
                duration: 1,
                price: 1,
                startDate: 1,
                endDate: 1,
                bookedDate: 1,
                confirmedDate: 1,
                cancelledDate: 1,
                status: 1,
                tourist: 1,
            }
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 },
                results: { $push: '$$ROOT' }
            }
        },
        {
            $project: {
                _id: 0,
                totalCount: 1,
                data: { $slice: ['$results', offsetData, limitData] }
            }
        }
    ])

    data = !data.length ? [{ totalCount: 0, data: [] }] : data;

    return response200(res, "Booking request fetch successfully.", true, data[0]);
});

// change status of booking request
const changeBookingStatus = catchAsyncError(async (req, res) => {
    const id = req.user
    const { bookingId, status } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const booking = await TouristBooking.findOne({ _id: bookingId, tourGuideId: id })
    if (!booking) return response400(res, "Booking request details not found")

    if (status === "confirmed") {
        booking.confirmedDate = new Date()
    }
    if (status === "cancelled") {
        booking.cancelledDate = new Date()
        booking.cancelledBy = id
    }

    booking.status = status
    await booking.save()

    return response200(res, "Status updated successfully", true, []);
})


module.exports = {
    addTourPackage,
    updateTourPackage,
    deletePackage,
    getMyTourPackages,
    deleteGalleryImage,
    getTourPackageDetails,
    getBookingRequest,
    changeBookingStatus
}