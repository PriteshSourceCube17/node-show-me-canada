const mongoose = require("mongoose");

const tripSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    location: {
        type: mongoose.Schema.ObjectId,
        ref: "City",
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    meetingTime: {
        type: String,
        default: "flexible"
    },
    hours: {
        type: Number,
        default: 2
    },
    numberOfPeople: {
        type: Number,
    },
    preferredGender: {
        type: [String]
    },
    status: {
        enum: [0, 1],
        type: Number,
        default: 1,
    },
    isExpired: {
        enum: [0, 1],
        type: Number,
        default: 0,
    },
    receivedOffersFrom: [{
        type: mongoose.Schema.ObjectId,
        ref: "User",
    }],
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("trip", tripSchema)