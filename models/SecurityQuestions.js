const mongoose = require("mongoose");

const securityQuestionSchema = mongoose.Schema({
    question: {
        type: String
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("securityQuestion", securityQuestionSchema)