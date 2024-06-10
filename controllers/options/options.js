const { default: mongoose } = require("mongoose");
const { response200 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { Activity, Hour, Language, City, User, Trip, SecurityQuestion, Team, AboutUs, Subscription, TouristBooking, TourPackage } = require("../../models");

// get all activity
const getAllActivity = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0, status: 1 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Activity.find(query).sort({ createdAt: -1 }).select('_id name icon createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Activity list loaded successfully", true, data);

});

// get all hour
const getAllHour = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0, status: 1 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Hour.find(query).sort({ createdAt: -1 }).select('_id name createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Hour list loaded successfully", true, data);

});

// get all language
const getAllLanguage = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0, status: 1 };

    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const findQuery = Language.find(query).sort({ createdAt: -1 }).select('_id name createdAt status')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Language list loaded successfully", true, data);

});

// get all city
const getAllCity = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0, status: 1 };

    if (search) {
        query.$or = [{ name: { $regex: search, $options: 'i' } }, { stateName: { $regex: search, $options: 'i' } }]
    }

    const findQuery = City.find(query).sort({ name: 1 }).select('_id name coverImage')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "City list loaded successfully", true, data);

});

// get all tour guide with filter
const getAllTourGuide = catchAsyncError(async (req, res) => {
    const { limit, offset, cityId, activities, gender, languages, priceFrom, priceTo, search, state, city } = req.body;
    const limitData = parseInt(limit, 10) || 50;
    const offsetData = parseInt(offset, 10) || 0;

    const query = { isDeleted: 0, status: 1, isTourGuide: true };
    const subQuery = { isDeleted: 0 }
    if (search) {
        subQuery.$or = [{ "location.name": { $regex: search, $options: 'i' } }, { "location.stateName": { $regex: search, $options: 'i' } }]
    }

    if (city) {
        subQuery["location.name"] = { $regex: city, $options: 'i' }
    }

    if (state) {
        subQuery["location.stateName"] = { $regex: state, $options: 'i' }
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
        subQuery["tourPackage.price"] = { $gte: priceFrom, $lte: priceTo }
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
                                { $project: { _id: 1, name: 1, coverImage: 1, stateName: 1 } }
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
                            localField: "userId",
                            foreignField: "tourGuide",
                            as: "tourPackage",
                            pipeline: [
                                { $match: { isDeleted: 0, status: 1 } }
                            ]
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
                            tourPackage: 1
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
        { $limit: limitData },
        { $skip: offsetData },
        {
            $project: {
                _id: 1,
                username: 1,
                role: 1,
                isTourGuide: 1,
                tourGuide: 1,
                rating: 1,
                noOfReviews: 1,
                priceStartFrom: { $arrayElemAt: ["$minPrice.minPrice", 0] }
            }
        }

    ])
    return response200(res, "Tour guide list loaded successfully", true, { total: data.length, data });

});

const getFeaturedTourGuide = catchAsyncError(async (req, res) => {
    const { limit, offset } = req.body;
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let data = await User.aggregate([
        { $match: { isDeleted: 0, status: 1, isTourGuide: true } },
        {
            $lookup: {
                from: "tourguides",
                localField: "_id",
                foreignField: "userId",
                as: "tourGuide",
                pipeline: [
                    { $match: { isFeatured: 1 } },
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
                            isWantToShowFree: 1,
                            hourlyRate: 1,
                            images: 1,
                            location: 1,
                            isFeatured: 1
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
        { $limit: limitData },
        { $skip: offsetData },
        { $sample: { size: limitData } },
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
        }

    ])
    return response200(res, "Tour guide list loaded successfully", true, { total: data.length, data });
})

// get about us data
const getAboutUs = catchAsyncError(async (req, res) => {
    const totalCities = await City.countDocuments({ isDeleted: 0, status: 1 })
    const totalTourGuide = await User.countDocuments({ isDeleted: 0, status: 1, role: "tour-guide" })
    const totalTrips = await Trip.countDocuments({ isDeleted: 0, status: 1 })
    const story = await AboutUs.find({ isDeleted: 0 }).select("_id  content  image ")
    return response200(res, "Details fetch successfully", true, { totalCities, totalTourGuide, totalTrips, story: story[0] });
})

// get security question
const getAllSecurityQuestion = catchAsyncError(async (req, res) => {
    const data = await SecurityQuestion.find({ isDeleted: 0 }).select("_id question")
    return response200(res, "Security question fetch successfully", true, data);
})

// get register user city
const registerUserCity = catchAsyncError(async (req, res) => {
    let data = await User.aggregate([
        { $match: { isDeleted: 0, status: 1, isTourGuide: true } },
        {
            $lookup: {
                from: "tourguides",
                localField: "_id",
                foreignField: "userId",
                as: "tourGuide",
            },
        },
        {
            $unwind: "$tourGuide"
        },
        {
            $group: {
                _id: "$tourGuide.location",
            }
        },
        {
            $lookup: {
                from: "cities",
                localField: "_id",
                foreignField: "_id",
                as: "location",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$location"
        },
        {
            $project: {
                _id: 0,
                location: 1
            }
        }

    ])
    return response200(res, "Register user cities", true, data)
});

// get all team member
const getAllTeamMembers = catchAsyncError(async (req, res) => {
    const data = await Team.find({ isDeleted: 0, status: 1 }).select("_id  name position image status createdAt")
    return response200(res, "Member list loaded successfully.", true, data)
})

// get highestRate
const highestRate = catchAsyncError(async (req, res) => {
    const data = await TourPackage.aggregate([
        { $match: { isDeleted: 0, status: 1 } },
        { $group: { _id: null, highestRate: { $max: '$price' } } },
        { $project: { _id: 0, highestRate: 1 } }
    ])
    return response200(res, "Highest rate", true, data[0])
});

// get all subscription
const getAllSubscription = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body;
    const query = { isDeleted: 0, status: 1 };

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const findQuery = Subscription.find(query).sort({ createdAt: 1 }).select('_id title description noOfProfileImage noOfCoverImage noOfTourPackage duration amount type')

    if (limit !== undefined && offset !== undefined) {
        const limitData = parseInt(limit, 10) || 10;
        const offsetData = parseInt(offset, 10) || 0;
        findQuery.skip(offsetData).limit(limitData);
    }

    const data = await findQuery;

    return response200(res, "Subscription list loaded successfully", true, data);

});

// get recent booking list
const getRecentBooking = catchAsyncError(async (req, res) => {
    const data = await TouristBooking.aggregate([
        { $match: { status: "completed" } },
        {
            $lookup: {
                from: "cities",
                localField: "locationId",
                foreignField: "_id",
                as: "location",
                pipeline: [
                    { $project: { _id: 1, name: 1, coverImage: 1 } }
                ]
            }
        },
        { $unwind: "$location" },
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
                                    $project: { _id: 1, images: 1 }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$details",
                            preserveNullAndEmptyArrays: true
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
                            details: 1,
                            priceStartFrom: {
                                $cond: {
                                    if: { $eq: [{ $size: "$minPrice" }, 0] },
                                    then: 0,
                                    else: { $arrayElemAt: ["$minPrice.minPrice", 0] }
                                }
                            }
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
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "bookingId",
                as: "tourGuideReviews",
                pipeline: [
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
                                        as: "details",
                                        pipeline: [
                                            {
                                                $project: { _id: 1, images: 1 }
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
                                        details: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$reviewer"
                    },
                    {
                        $project: {
                            _id: 1,
                            receiverId: 1,
                            review: 1,
                            rating: 1,
                            reviewer: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                review: {
                    $filter: {
                        input: "$tourGuideReviews",
                        as: "tourGuideReviews",
                        cond: { $eq: ["$$tourGuideReviews.receiverId", "$tourGuide._id"] }
                    }
                }
            }
        },
        {
            $unwind: {
                path: "$review",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                tourGuide: 1,
                location: 1,
                review: 1,
            }
        }
    ])

    return response200(res, "Recent bookings list fetch successfully.", true, data);
});

// get recent booking list
const getAllTourPackage = catchAsyncError(async (req, res) => {

    const { city, priceFrom, priceTo, limit, offset } = req.body
    const limitData = parseInt(limit, 10) || 10
    const offsetData = parseInt(offset, 10) || 0

    const query = { isDeleted: 0, status: 1 }

    if (city && city.length) {
        const cityIds = city.map(val => new mongoose.Types.ObjectId(val));
        query.locationId = { $in: cityIds };
    }

    if (priceFrom !== "" && priceTo !== "") {
        query.price = { $gte: priceFrom, $lte: priceTo }
    }

    let data = await TourPackage.aggregate([
        { $match: query },
        {
            $lookup: {
                from: "users",
                localField: "tourGuide",
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
                                { $project: { _id: 1, images: 1 } },
                            ]
                        }
                    },
                    {
                        $unwind: "$details"
                    },
                    { $project: { _id: 1, username: 1, details: 1 } },
                ]
            },

        },
        {
            $unwind: "$tourGuide"
        },
        {
            $lookup: {
                from: "cities",
                localField: "locationId",
                foreignField: "_id",
                as: "location",
                pipeline: [
                    { $project: { _id: 1, name: 1 } }
                ]
            },

        },
        {
            $unwind: "$location"
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                tourGuide: 1,
                title: 1,
                description: 1,
                price: 1,
                duration: 1,
                galleryImages: 1,
                location: 1
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
                data: { $slice: ["$result", offsetData, limitData] }
            }
        }
    ])
    data = !data.length ? [{ totalCount: 0, data: [] }] : data;
    return response200(res, "Record fetch successfully.", true, data[0]);
});

module.exports = {
    getAllActivity,
    getAllHour,
    getAllLanguage,
    getAllCity,
    getAllTourGuide,
    getFeaturedTourGuide,
    getAboutUs,
    getAllSecurityQuestion,
    registerUserCity,
    getAllTeamMembers,
    highestRate,
    getAllSubscription,
    getRecentBooking,
    getAllTourPackage
}