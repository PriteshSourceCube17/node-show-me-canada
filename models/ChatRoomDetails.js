const mongoose = require("mongoose");

const chatRoomDetailsSchema = mongoose.Schema({
    groupId: {
        type: mongoose.Types.ObjectId,
        ref: "ChatRoom"
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    badge: {
        type: Number
    },
}, { timestamps: true });

module.exports = mongoose.model("ChatRoomDetails", chatRoomDetailsSchema)