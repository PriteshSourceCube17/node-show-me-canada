const mongoose = require("mongoose");

const hourSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
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

module.exports = mongoose.model("hour", hourSchema)