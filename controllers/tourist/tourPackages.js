const { default: mongoose, Mongoose } = require("mongoose");
const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, TourPackage, TouristBooking, TouristPayment } = require("../../models");
const { validationResult } = require("express-validator");

// get all tour packages
const getLatestTourPackage = catchAsyncError(async (req, res) => {

    const data = await TourPackage.aggregate([
        { $match: { isDeleted: 0, status: 1 } },
        {
            $lookup: {
                from: "users",
                localField: "tourGuide",
                foreignField: "_id",
                as: "tourGuide",
                pipeline: [
                    { $project: { _id: 1, username: 1, isTourGuide: 1 } }
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
        }
    ])

    return response200(res, "Tour packages loaded successfully.", true, data)
})

// book tour package
const bookedPackage = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { packageId, startDate, success, message } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    if (!mongoose.Types.ObjectId.isValid(packageId)) return response400(res, "Please enter valid packageId")

    const tourPackage = await TourPackage.findOne({ _id: packageId, isDeleted: 0 })
    if (!tourPackage) response400(res, "Tour package details not found.")
    let { tourGuide, title, description, locationId, price, duration } = tourPackage

    // stored payment
    const status = success == "true" ? 1 : 2
    const payment = await TouristPayment.create({ userId: userId, tourPackageId: packageId, amount: price, title, description, locationId, duration, tourGuideId: tourGuide, status: status, message, startDate })

    if (success == "true") {
        await TouristBooking.create({
            packageId,
            title,
            description,
            locationId,
            price,
            duration,
            tourGuideId: tourGuide,
            touristId: userId,
            startDate,
            status: "paid",
            // endDate,
            bookedDate: new Date(),
            paymentId: payment._id
        })
        return response200(res, "Booked successfully.", true, [])
    } else {
        return response400(res, "Unable to complete booking. Payment failed.", true, [])
    }

})

const getMyBookingReq = catchAsyncError(async (req, res) => {
    const user = req.user
    const { limit, offset, search } = req.body
    const limitData = parseFloat(limit, 10) || 10
    const offsetData = parseFloat(offset, 10) || 0

    const query = {}
    if (search) {
        query.$or = [
            { "location.name": { $regex: search, $options: "i" } },
            { "tourGuide.username": { $regex: search, $options: "i" } },
        ]
    }

    let data = await TouristBooking.aggregate([
        { $match: { isDeleted: 0, touristId: new mongoose.Types.ObjectId(user) } },
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
        {
            $unwind: {
                path: "$location",
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
                                    $project: {
                                        _id: 1,
                                        images: 1,
                                    }
                                },

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
                            details: 1,
                        }
                    }
                ]
            }
        },
        { $unwind: "$tourGuide" },
        { $match: query },
        {
            $lookup: {
                from: "tourpackages",
                localField: "packageId",
                foreignField: "_id",
                as: "tourPackage",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            galleryImages: 1
                        }
                    },

                ]
            }
        },
        {
            $unwind: "$tourPackage"
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                tourGuide: 1,
                tourPackage: 1,
                packageId: 1,
                title: 1,
                description: 1,
                location: 1,
                duration: 1,
                price: 1,
                startDate: 1,
                endDate: 1,
                confirmedDate: 1,
                cancelledDate: 1,
                bookedDate: 1,
                status: 1,
            }
        },
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 },
                result: { $push: '$$ROOT' }
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
    return response200(res, "Booking list loaded successfully.", true, data[0])
})

// change status of booking request
const cancelBookingRequest = catchAsyncError(async (req, res) => {
    const id = req.user
    const { bookingId } = req.body

    if (!bookingId) return response400(res, "bookingId id is required");
    if (!mongoose.Types.ObjectId.isValid(bookingId)) return response400(res, "Please enter valid bookingId");

    const booking = await TouristBooking.findOne({ _id: bookingId, touristId: id })
    if (!booking) return response400(res, "Booking request details not found")

    booking.cancelledDate = new Date()
    booking.status = "cancelled"
    booking.cancelledBy = id

    await booking.save()

    return response200(res, "Status updated successfully", true, []);
})

const getMyTransactionHistory = catchAsyncError(async (req, res) => {
    const id = req.user
    const data = await TouristPayment.find({ userId: id }).select("_id tourPackageId title description locationId startDate amount status message createdAt duration").sort({ createdAt: -1 })
    return response200(res, "Record fetch successfully.", true, data);
})

module.exports = {
    getLatestTourPackage,
    bookedPackage,
    getMyBookingReq,
    cancelBookingRequest,
    getMyTransactionHistory
}