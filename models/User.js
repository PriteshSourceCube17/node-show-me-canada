const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        enum: ['tourist', 'tour-guide'],
        type: String,
        required: true
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 1,
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordTokenExpires: {
        type: Date
    },
    isTourGuide: {
        type: Boolean,
        default: false
    },
    accountCloseByUser: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null,
    },
    verificationCodeExpires: {
        type: Date,
    },
    isVerified: {
        enum: [0, 1],
        type: Number,
        default: 0,
    },
    subscriptionPlanId: {
        type: mongoose.Types.ObjectId,
        ref: "subscription"
    },
    rating: {
        type: Number,
        default: 0,
    },
    noOfReviews: {
        type: Number,
        default: 0,
    },
    socketId: {
        type: String,
    },
    hasSubscription: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema)