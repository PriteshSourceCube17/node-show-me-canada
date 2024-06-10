const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { validationResult } = require("express-validator");
const { User, City, Trip, TourGuide, TourPackage, TouristBooking, Tourist } = require("../../models");
const { default: mongoose } = require("mongoose");

// get all users
const getAllUsers = catchAsyncError(async (req, res) => {
    const { limit, offset, search, role } = req.body
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let mainQuery = { isDeleted: 0 }
    let searchQuery = {}
    if (search) {
        searchQuery.$or = [
            { "username": { $regex: search, $options: 'i' } },
            { "details.location.name": { $regex: search, $options: 'i' } },
        ];
    }

    if (role) {
        mainQuery.role = role;
    }
    let data = await User.aggregate([
        { $match: mainQuery },
        {
            $lookup: {
                from: "tourists",
                localField: "_id",
                foreignField: "userId",
                as: "touristData",
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
                        $project: {
                            languages: 1,
                            isMobileVerified: 1,
                            images: 1,
                            location: 1,
                            aboutMe: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
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
                        $project: {
                            isMobileVerified: 1,
                            languages: 1,
                            activities: 1,
                            images: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
                            aboutMe: 1,
                            duration: 1,
                            gender: 1,
                            hourlyRate: 1,
                            isWantToShowFree: 1,
                            motto: 1,
                            willShowYou: 1,
                            location: 1,
                            isFeatured: 1
                        }
                    }
                ]
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                username: 1,
                email: 1,
                role: 1,
                status: 1,
                details: {
                    $cond: {
                        if: { $eq: ["$role", "tourist"] },
                        then: { $arrayElemAt: ["$touristData", 0] },
                        else: { $arrayElemAt: ["$tourGuideData", 0] }
                    }
                }
            }
        },
        { $match: searchQuery },
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

    return response200(res, "User list loaded successfully.", true, data[0])
})

// get single user details
const getUserDetails = catchAsyncError(async (req, res) => {
    const { userId } = req.params;

    let data = await User.aggregate([
        { $match: { isDeleted: 0, _id: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "tourists",
                localField: "_id",
                foreignField: "userId",
                as: "touristData",
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
                        $project: {
                            languages: 1,
                            isMobileVerified: 1,
                            images: 1,
                            location: 1,
                            aboutMe: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
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
                        $lookup: {
                            from: "usersubscriptionplans",
                            localField: "userId",
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
                    {
                        $lookup: {
                            from: "tourpackages",
                            localField: "userId",
                            foreignField: "tourGuide",
                            as: "tourPackage",
                            pipeline: [
                                { $match: { isDeleted: 0 } },
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
                        $project: {
                            isMobileVerified: 1,
                            languages: 1,
                            activities: 1,
                            images: 1,
                            mobileNumber: 1,
                            mobileCountryCode: 1,
                            aboutMe: 1,
                            duration: 1,
                            gender: 1,
                            hourlyRate: 1,
                            isWantToShowFree: 1,
                            motto: 1,
                            willShowYou: 1,
                            location: 1,
                            isFeatured: 1,
                            subscriptionPlan: 1,
                            bannerImages: 1,
                            galleryImages: 1,
                            galleryVideo: 1,
                            tourPackage: 1
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
                status: 1,
                details: {
                    $cond: {
                        if: { $eq: ["$role", "tourist"] },
                        then: { $arrayElemAt: ["$touristData", 0] },
                        else: { $arrayElemAt: ["$tourGuideData", 0] }
                    }
                }
            }
        },
    ])

    if (data.length === 0) {
        return response400(res, "User details not found.")
    } else {
        return response200(res, "User details get successfully.", true, data)
    }
})

// for change user status
const changeUserStatus = catchAsyncError(async (req, res) => {
    const { userId, status } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const user = await User.findById(userId)
    if (!user) return response400(res, "User details not found")

    user.status = status
    await user.save()

    return response200(res, "Status updated successfully", true, []);
})

// change is featured status
const changeFeaturedStatus = catchAsyncError(async (req, res) => {
    const { userId, isFeatured } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const tourGuide = await TourGuide.findOne({ userId })
    if (!tourGuide) return response400(res, "Tour guide details not found")

    tourGuide.isFeatured = isFeatured
    await tourGuide.save()

    return response200(res, "Status updated successfully", true, []);
})

// de active tour package
const changePackageStatus = catchAsyncError(async (req, res) => {
    const { packageId, status } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const package = await TourPackage.findOne({ _id: packageId })
    if (!package) return response400(res, "Package details not found")

    package.status = status
    await package.save()

    return response200(res, "Status updated successfully", true, []);
})

// get tour guide booking request
const getPackageBookingRequest = catchAsyncError(async (req, res) => {

    const { tourGuideId, touristId } = req.body

    let query = { isDeleted: 0 }
    if (tourGuideId) {
        query = { tourGuideId: new mongoose.Types.ObjectId(tourGuideId) }
    }

    if (touristId) {
        query = { touristId: new mongoose.Types.ObjectId(touristId) }
    }

    const data = await TouristBooking.aggregate([
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
                            email: 1,
                            role: 1,
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
        {
            $lookup: {
                from: "users",
                localField: "tourGuideId",
                foreignField: "_id",
                as: "tourGuide",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourguides",
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
                            email: 1,
                            role: 1,
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
        {
            $unwind: {
                path: "$tourGuide",
                preserveNullAndEmptyArrays: true
            }
        },
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
                cancelledBy: 1,
                status: 1,
                details: {
                    $cond: {
                        if: { $ne: [tourGuideId, null] },
                        then: "$tourist",
                        else: "$tourGuide"
                    }
                }
            }
        }


    ])

    return response200(res, "Booking request fetch successfully.", true, data);
});

// get tour guide booking request
const getAllBookingRequest = catchAsyncError(async (req, res) => {

    const { limit, offset, search } = req.body
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let query = { isDeleted: 0 }
    if (search) {
        query.$or = [{ "tourist.username": { $regex: search, $options: 'i' } }, { "tourGuide.username": { $regex: search, $options: 'i' } }]
    }


    let data = await TouristBooking.aggregate([
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
                from: "tourpackages",
                localField: "packageId",
                foreignField: "_id",
                as: "packageImages",
                pipeline: [
                    { $project: { _id: 0, galleryImages: 1 } }
                ]
            }
        },
        {
            $unwind: {
                path: "$packageImages",
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
                            email: 1,
                            role: 1,
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
        {
            $lookup: {
                from: "users",
                localField: "tourGuideId",
                foreignField: "_id",
                as: "tourGuide",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourguides",
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
                            email: 1,
                            role: 1,
                            details: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$tourGuide",
                preserveNullAndEmptyArrays: true
            }
        },
        { $match: query },
        { $sort: { bookedDate: -1 } },
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
                cancelledBy: 1,
                status: 1,
                tourist: 1,
                tourGuide: 1,
                packageImages: "$packageImages.galleryImages"
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
    return response200(res, "Booking list loaded successfully.", true, data[0])
});

// delete user and  related data
const deleteUser = catchAsyncError(async (req, res) => {
    const { userId } = req.params

    const user = await User.findOne({ _id: userId })
    if (!user) return response400(res, "User details not found")

    user.isDeleted = 1
    if (user.role === "tour-guide") {
        await TourGuide.updateOne({ userId: userId }, { $set: { isDeleted: 1 } })
        await TourPackage.updateMany({ tourGuide: userId }, { $set: { isDeleted: 1 } })
    } else {
        await Tourist.updateOne({ userId: userId }, { $set: { isDeleted: 1 } })
    }

    await user.save()

    return response200(res, "Deleted successfully", true, []);
})
module.exports = {
    getAllUsers,
    getUserDetails,
    changeUserStatus,
    changeFeaturedStatus,
    changePackageStatus,
    getPackageBookingRequest,
    getAllBookingRequest,
    deleteUser
}
