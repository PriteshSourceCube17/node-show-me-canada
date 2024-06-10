const mongoose = require("mongoose");

const chatRoomSchema = mongoose.Schema({
    // createdBy: {
    //     createdById: {
    //         type: mongoose.Types.ObjectId,
    //         ref: "User"
    //     },
    //     unreadCount: {
    //         type: Number,
    //         default: 0
    //     }
    // },
    // member: {
    //     memberId: {
    //         type: mongoose.Types.ObjectId,
    //         ref: "User"
    //     },
    //     unreadCount: {
    //         type: Number,
    //         default: 0
    //     }
    // },
    // lastMessageId: {
    //     type: mongoose.Types.ObjectId,
    //     ref: "chatMessage"
    // },
    // status: {
    //     enum: [0, 1],
    //     type: Number,
    //     default: 1,
    // },
    // isDeleted: {
    //     enum: [0, 1],
    //     type: Number,
    //     default: 0,
    // }

    groupName: {
        type: String
    },
    lastMessage: {
        type: String
    },
    createdById: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });

module.exports = mongoose.model("ChatRoom", chatRoomSchema)