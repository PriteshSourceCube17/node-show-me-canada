const mongoose = require("mongoose");

const tourGuideTripSchema = mongoose.Schema({
    touristId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
    },
    tripId: {
        type: mongoose.Schema.ObjectId,
        ref: "Trips",
        required: true,
    },
    tourGuideId: {
        type: mongoose.Schema.ObjectId,
        ref: "TourGuide",
        required: true,
    },
    location: {
        type: mongoose.Schema.ObjectId,
        ref: "City",
        required: true,
    },
    isRequestSend: {
        type: Boolean,
        default: false,
    },
    type: {
        type: String,
        default: "trip",
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 1,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("tourGuideTrip", tourGuideTripSchema)