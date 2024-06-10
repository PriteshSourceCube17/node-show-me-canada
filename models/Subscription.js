const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema({

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
    productId: {
        type: String,
        comment: 'Stripe Product Id'
    },
    priceId: {
        type: String,
        comment: 'Stripe Price Id'
    },
    type: {
        type: String,
        enum: ["paid", "free"]
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

module.exports = mongoose.model("subscription", subscriptionSchema)