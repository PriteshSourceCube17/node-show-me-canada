const mongoose = require("mongoose");

const tourGuideSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
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
    images: [{
        url: String,
        primary: {
            type: Boolean,
            default: false

        }
    }],
    bannerImages: [{
        url: String,
    }],
    galleryVideo: [{
        link: String,
        thumbnail: String
    }],
    galleryImages: [{
        url: String,
    }],
    isWantToShowFree: {
        type: Boolean,
        default: true,
    },
    hourlyRate: {
        currency: {
            type: String,
        },
        rate: {
            type: Number,
            default: 0
        }
    },
    duration: {
        type: mongoose.Schema.ObjectId,
        ref: "Hour",
    },
    gender: {
        type: String,
    },
    location: {
        type: mongoose.Schema.ObjectId,
        ref: "City",
    },
    languages: [{
        type: mongoose.Schema.ObjectId,
        ref: "Language",
    }],
    activities: [{
        type: mongoose.Schema.ObjectId,
        ref: "Activity",
    }],
    aboutMe: {
        type: String,
    },
    motto: {
        type: String,
    },
    willShowYou: {
        type: String,
    },
    isFeatured: {
        enum: [0, 1],
        type: Number,
        default: 0,
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("tourGuide", tourGuideSchema)