const mongoose = require("mongoose");

const touristSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    images: [{
        url: String,
        primary: {
            type: Boolean,
            default: false

        }
    }],
    location: {
        type: mongoose.Schema.ObjectId,
        ref: "City",
    },
    languages: [{
        type: mongoose.Schema.ObjectId,
        ref: "Language",
    }],
    aboutMe: {
        type: String,
    },
    mobileNumber: {
        type: String,
    },
    mobileCountryCode: {
        type: String,
    },
    mobileVerifyOtp: {
        type: String
    },
    isMobileVerified: {
        type: Number,
        enum: [0, 1],
        default: 0
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("Tourist", touristSchema)