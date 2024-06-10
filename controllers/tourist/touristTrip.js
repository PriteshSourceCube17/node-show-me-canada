const { response200, response400 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { Trip, User, City, TourGuideTrip } = require("../../models");
const { validationResult } = require("express-validator");
const ErrorHandler = require("../../utils/ErrorHandling");
const HttpStatus = require("../../utils/HttpStatus");
const { default: mongoose } = require("mongoose");

// find tour guide
const findTourGuides = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { location, preferredGender, userId, tripId } = data;

            const query = {
                isDeleted: 0,
                status: 1,
                location: new mongoose.Types.ObjectId(location),
                _id: { $ne: new mongoose.Types.ObjectId(userId) },
                isTourGuide: true
            };

            if (preferredGender && preferredGender.length) {
                query.gender = { $in: preferredGender };
            }

            const tourGuides = await User.aggregate([
                { $match: query },
                { $project: { _id: 1 } }
            ]);

            let temp = []
            if (tourGuides.length) {
                tourGuides.forEach((val) => {
                    temp.push({
                        touristId: userId,
                        tourGuideId: val._id,
                        tripId: tripId,
                        location: location
                    })
                });
            }

            await TourGuideTrip.insertMany(temp)
            resolve(tourGuides);
        } catch (error) {
            reject(error);
        }
    });
}

// create trip
const createTrip = catchAsyncError(async (req, res) => {
    const id = req.user;
    let { location } = req.body;

    const errors = validationResult(req);
    if (errors.errors.length !== 0) {
        throw new ErrorHandler(errors?.errors[0]?.msg, HttpStatus.BAD_REQUEST);
    };

    if (!mongoose.Types.ObjectId.isValid(location)) return response400(res, "Please enter valid location")

    const city = await City.findOne({ _id: location, isDeleted: 0 })
    if (!city) return response400(res, "Location not found")

    const user = await User.findById(id)
    if (user && user.location) {
        if (user.location.toString() === location) return response400(res, "Cannot create a trip to your home location")
    }


    let isMatch = await Trip.findOne({ location: location, userId: id })
    if (isMatch) return response400(res, "Trip is already exits for this location")

    const trip = await Trip.create({ ...req.body, userId: id })
    if (trip) {
        req.body.tripId = trip._id
        req.body.userId = id
    }
    // findTourGuides(req.body).then(() => { })

    return response200(res, "Trip created successfully", true, [])

})

// for trip status
const changeTripStatus = catchAsyncError(async (req, res) => {
    const id = req.user
    const { tripId, status } = req.body

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const trip = await Trip.findOne({ _id: tripId, userId: id, isDeleted: 0 })
    if (!trip) return response400(res, "Trip details not found")

    trip.status = status
    await trip.save()

    await TourGuideTrip.updateMany({ tripId: tripId }, { $set: { status: status } })
    return response200(res, "Status updated successfully", true, []);
})

// for trip delete
const deleteTrip = catchAsyncError(async (req, res) => {
    const id = req.user
    const { tripId } = req.params

    const errors = validationResult(req);
    if (errors.errors.length !== 0) return response400(res, errors?.errors[0]?.msg);

    const trip = await Trip.findOne({ _id: tripId, userId: id, isDeleted: 0 })
    if (!trip) return response400(res, "Trip details not found")

    trip.isDeleted = 1
    await trip.save()

    await TourGuideTrip.updateMany({ tripId: tripId }, { $set: { isDeleted: 1 } })
    return response200(res, "Deleted successfully", true, []);
})

// get my trips
const getMyTrips = catchAsyncError(async (req, res) => {
    const id = req.user;
    const data = await Trip.aggregate([
        { $match: { isDeleted: 0, userId: new mongoose.Types.ObjectId(id) } },
        {
            $lookup: {
                from: "cities",
                localField: "location",
                foreignField: "_id",
                as: "location",
                pipeline: [
                    { $match: { isDeleted: 0 } },
                    { $project: { _id: 1, name: 1, coverImage: 1 } }
                ]
            }
        },
        { $unwind: "$location" },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                _id: 1,
                location: 1,
                startDate: 1,
                endDate: 1,
                meetingTime: 1,
                hours: 1,
                numberOfPeople: 1,
                preferredGender: 1,
                status: 1,
                isExpired: 1,
                createdAt: 1
            }
        },

    ])
    return response200(res, "Trips list load successfully", true, data)
})

// // get conversion
// const getRequests = catchAsyncError(async (req, res) => {
//     const id = req.user;
//     const data = await TourGuideTrip.aggregate([
//         { $match: { isDeleted: 0, tourGuideId: new mongoose.Types.ObjectId(id), status: 1 } },
//         {
//             $lookup: {
//                 from: "cities",
//                 localField: "location",
//                 foreignField: "_id",
//                 as: "location",
//                 pipeline: [
//                     { $match: { isDeleted: 0 } },
//                     { $project: { _id: 1, name: 1, countryCode: 1, stateCode: 1, latitude: 1, longitude: 1, stateName: 1 } }
//                 ]
//             }
//         },
//         { $unwind: "$location" },
//         {
//             $lookup: {
//                 from: "trips",
//                 localField: "tripId",
//                 foreignField: "_id",
//                 as: "trip",
//                 pipeline: [
//                     { $match: { isDeleted: 0 } },
//                     {
//                         $lookup: {
//                             from: "cities",
//                             localField: "location",
//                             foreignField: "_id",
//                             as: "location",
//                             pipeline: [
//                                 { $match: { isDeleted: 0 } },
//                                 { $project: { _id: 1, name: 1, countryCode: 1, stateCode: 1, latitude: 1, longitude: 1, stateName: 1 } }
//                             ]
//                         }
//                     },
//                     { $unwind: "$location" },
//                     { $project: { _id: 1, location: 1, startDate: 1, endDate: 1, meetingTime: 1, createdAt: 1 } }
//                 ]
//             }
//         },
//         { $unwind: "$trip" },
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "touristId",
//                 foreignField: "_id",
//                 as: "tourist",
//                 pipeline: [
//                     { $project: { _id: 1, username: 1, images: 1 } }
//                 ]
//             }
//         },
//         { $unwind: "$tourist" },
//         { $sort: { createdAt: -1 } },
//         {
//             $project: {
//                 _id: 1,
//                 // location: 1,
//                 isRequestSend: 1,
//                 type: 1,
//                 createdAt: 1,
//                 trip: 1,
//                 tourist: 1
//             }
//         }
//     ])
//     return response200(res, "Request load successfully", true, data)
// })

module.exports = {
    createTrip,
    changeTripStatus,
    deleteTrip,
    // getRequests,
    getMyTrips
}