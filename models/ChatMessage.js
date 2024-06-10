const mongoose = require("mongoose");

const chatMessageSchema = mongoose.Schema({
    chatRoomId: {
        type: mongoose.Types.ObjectId,
        ref: "ChatRoom"
    },
    senderId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    message: {
        type: String,
        required: true
    },
    isDeleted: {
        enum: [0, 1],
        type: Number,
        default: 0,
    }
}, { timestamps: true });

module.exports = mongoose.model("chatMessage", chatMessageSchema)