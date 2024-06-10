const mongoose = require("mongoose");

const touristPaymentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users",
        required: true
    },
    tourPackageId: {
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
    tourGuideId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    startDate: {
        type: Date,
        required: true,
    },
    paymentId: {
        type: String,
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        enum: [0, 1, 2],
        type: Number,
        default: 0,
        comment: '0=pending, 1=success, 2=failed',
    },
    message: {
        type: String,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("touristPayment", touristPaymentSchema)