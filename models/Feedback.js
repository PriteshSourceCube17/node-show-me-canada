const mongoose = require("mongoose");

const feedbackSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    feedback: {
        type: String,
        required: true
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("feedback", feedbackSchema)