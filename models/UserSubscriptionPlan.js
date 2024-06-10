const mongoose = require("mongoose");

const userSubscriptionPlanSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subscriptionId: {
        type: mongoose.Schema.ObjectId,
        ref: "subscription",
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    noOfProfileImage: {
        type: Number,
        required: true
    },
    noOfCoverImage: {
        type: Number,
        required: true
    },
    noOfTourPackage: {
        type: Number,
        required: true
    },
    // duration: {
    //     type: String,
    //     required: true
    // },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    purchaseDate: {
        type: Date,
    },
    // expiredDate: {
    //     type: Date,
    // },
    status: {
        enum: [0, 1],
        type: Number,
        default: 1,
    },
    paymentId: {
        type: mongoose.Types.ObjectId,
        ref: "subscriptionPayment"
    },
    // isExpired: {
    //     enum: [0, 1],
    //     type: Number,
    //     default: 0,
    // },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("userSubscriptionPlan", userSubscriptionPlanSchema)