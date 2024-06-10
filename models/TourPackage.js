const mongoose = require("mongoose");

const tourPackageSchema = mongoose.Schema({
    tourGuide: {
        type: mongoose.Types.ObjectId,
        ref: "User",
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
    bannerImage: {
        type: String
    },
    galleryImages: [{
        url: String,
    }],
    duration: {
        type: String
    },
    price: {
        type: Number
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

module.exports = mongoose.model("TourPackage", tourPackageSchema)