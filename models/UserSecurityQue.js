const mongoose = require("mongoose");

const userSecurityQueSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    questionId: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    question: {
        type: String
    },
    answer: {
        type: String
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("userSecurityQue", userSecurityQueSchema)