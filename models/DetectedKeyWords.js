const mongoose = require("mongoose");

const detectedKeywordSchema = mongoose.Schema({
    keyword: {
        type: String,
        required: true,
        trim: true
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

module.exports = mongoose.model("detectedKeyword", detectedKeywordSchema)