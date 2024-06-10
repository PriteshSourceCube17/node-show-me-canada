const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
    name: {
        type: String,
    },
    position: {
        type: String,
    },
    image: {
        type: String
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

module.exports = mongoose.model("team", teamSchema)