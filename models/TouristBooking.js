const mongoose = require("mongoose");

const touristBookingSchema = mongoose.Schema({
    packageId: {
        type: mongoose.Types.ObjectId,
        ref: "TourPackage",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    locationId: {
        type: mongoose.Types.ObjectId,
        ref: "city"
    },
    duration: {
        type: String
    },
    price: {
        type: Number
    },
    tripId: {
        type: mongoose.Types.ObjectId,
        ref: "trip",
    },
    tourGuideId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    touristId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true,
    },
    // endDate: {
    //     type: Date,
    //     required: true,
    // },
    bookedDate: {
        type: Date
    },
    confirmedDate: {
        type: Date
    },
    cancelledDate: {
        type: Date
    },
    cancelledBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    paymentId: {
        type: String,
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "ongoing", "completed", "paid"],
        default: "pending"
    },
    active: {
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

module.exports = mongoose.model("TouristBooking", touristBookingSchema)