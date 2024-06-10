const mongoose = require("mongoose");

const citySchema = mongoose.Schema({
    name: {
        type: String,
    },
    countryCode: {
        type: String,
    },
    stateCode: {
        type: String,
    },
    latitude: {
        type: String,
    },
    longitude: {
        type: String,
    },
    stateName: {
        type: String,
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 1,
    },
    coverImage: {
        type: String
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("city", citySchema)