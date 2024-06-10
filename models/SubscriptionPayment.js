const mongoose = require("mongoose");

const subscriptionPaymentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "users",
        required: true
    },
    subscriptionPlanId: {
        type: mongoose.Types.ObjectId,
        ref: "subscription",
        required: true
    },
    title: {
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
        type: String
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("subscriptionPayment", subscriptionPaymentSchema)