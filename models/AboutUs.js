const mongoose = require("mongoose");

const aboutUsSchema = mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("aboutUs", aboutUsSchema)