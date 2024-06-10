const mongoose = require("mongoose");

const languageSchema = mongoose.Schema({
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

module.exports = mongoose.model("language", languageSchema)