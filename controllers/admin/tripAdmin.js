const { response200 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { Trip } = require("../../models");

// get all trip
const getAllTrip = catchAsyncError(async (req, res) => {
    const { limit, offset, search } = req.body
    const limitData = parseInt(limit, 10) || 10;
    const offsetData = parseInt(offset, 10) || 0;

    let searchQuery = { isDeleted: 0 }
    if (search) {
        searchQuery.$or = [
            { "location.name": { $regex: search, $options: 'i' } },
            // { "location.stateName": { $regex: search, $options: 'i' } },
        ]
    }

    let data = await Trip.aggregate([
        { $match: { isDeleted: 0 } },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "details",
                            pipeline: [
                                { $project: { images: 1, aboutMe: 1 } }
                            ]
                        }
                    },
                    { $unwind: "$details" },
                    { $project: { _id: 1, username: 1, role: 1, details: 1, email: 1 } },
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
        { $unwind: "$location" },
        { $unwind: "$user" },
        { $match: searchQuery },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                userId: 1,
                location: 1,
                startDate: 1,
                endDate: 1,
                meetingTime: 1,
                hours: 1,
                numberOfPeople: 1,
                preferredGender: 1,
                status: 1,
                isExpired: 1,
                receivedOffersFrom: 1,
                createdAt: 1,
                user: 1
            }
        },
        // manage pagination
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
    return response200(res, "Trip list loaded successfully.", true, data[0])
})
module.exports = {
    getAllTrip
}
