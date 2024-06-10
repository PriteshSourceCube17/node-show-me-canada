const mongoose = require("mongoose");

const activitySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    icon: {
        type: String,
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

module.exports = mongoose.model("activity", activitySchema)