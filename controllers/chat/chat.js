
const { response400, response200 } = require("../../lib/response-messages/response");
const catchAsyncError = require("../../middleware/catchAsyncError");
const { User, ChatRoom, ChatMessage, DetectedKeyword, ChatRoomDetails } = require("../../models")
const { default: mongoose } = require("mongoose");

const getSingleRoomDetails = async (roomId) => {
    const result = await ChatRoom.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
        {
            $lookup: {
                from: "users",
                localField: "createdBy.createdById",
                foreignField: "_id",
                as: "createdBy.createdByDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            noOfReviews: 1,
                            rating: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ],
            }
        },
        { $unwind: "$createdBy.createdByDetails" },
        {
            $lookup: {
                from: "users",
                localField: "member.memberId",
                foreignField: "_id",
                as: "member.memberDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            noOfReviews: 1,
                            rating: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ],
            }
        },
        { $unwind: "$member.memberDetails" },
        {
            $lookup: {
                from: "chatmessages",
                localField: "lastMessageId",
                foreignField: "_id",
                as: "lastMessage",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "senderId",
                            foreignField: "_id",
                            as: "sender",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                    bannerImages: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                    bannerImages: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        role: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ],
                        }
                    },
                    { $unwind: "$sender" },
                    {
                        $project: {
                            _id: 1,
                            message: 1,
                            sender: 1,
                        }
                    }

                ]
            }
        },
        {
            $unwind: {
                path: "$lastMessage",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                createdBy: 1,
                member: 1,
                status: 1,
                createdAt: 1,
                lastMessage: 1
            }
        }
    ])

    return result[0]
}

// detect keyword from chat messages
const detectKeyword = catchAsyncError(async (req, res) => {
    const { message } = req.body
    let keywords = []
    let detectedWord = []
    let containsEmail = false;
    let containsPhone = false;

    let list = await DetectedKeyword.find({ isDeleted: 0 }).select("keyword")
    if (list.length) list.filter((val) => keywords.push(val.keyword))


    if (keywords.includes("email")) {
        // const emailRegex = /\b[A-Za-z0-9._%+-]+@?[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        // const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        // const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}(?:\.[A-Za-z]{2,})?\b/;
        const emailRegex = /\b[A-Za-z0-9._%+-]+@?[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        containsEmail = emailRegex.test(message);
        if (containsEmail) {
            detectedWord.push("email");
        }
    }

    if (keywords.includes("phonenumber")) {
        console.log('phonenumber');
        const phoneRegex = /(?:\+?(\d{1,3}))?[-. ]?(\d{3})[-. ]?(\d{3})[-. ]?(\d{4})/;
        containsPhone = phoneRegex.test(message);
        console.log('✌️containsPhone --->', containsPhone);
        if (containsPhone) {
            detectedWord.push("Phone number");
        }
    }

    const words = message.split(/\s+/);
    words.forEach(word => {
        const lowercaseWord = word.toLowerCase();
        keywords.forEach(val => {
            if (lowercaseWord.includes(val)) {
                detectedWord.push(word);
            }
        });
    });

    if (detectedWord.length) {
        return response400(res, `${detectedWord.join(", ")} word detected.`)
    } else {
        return response200(res, "No any word detected")
    }

})

const createRoom = async (userId, data) => {
    try {
        let { member } = data
        const user = await User.findOne({ _id: member, status: 1, isDeleted: 0 })
        if (!user) return { success: false, message: "User not found." }

        const existingRoom = await ChatRoom.findOne({
            $or: [
                { "createdBy.createdById": userId, "member.memberId": member },
                { "createdBy.createdById": member, "member.memberId": userId }
            ]
        });
        let roomId = ""
        if (existingRoom) {
            roomId = existingRoom._id
        } else {
            let room = await ChatRoom.create({ "createdBy.createdById": userId, "member.memberId": member })
            roomId = room._id
        }

        const roomDetails = await getSingleRoomDetails(roomId)
        return roomDetails

    } catch (error) {
        console.log('error --->', error);
    }
}

const sendMessage = async (userId, data) => {
    let { chatRoomId, message } = data

    // const emailRegex = /\b[A-Za-z0-9._%+-]+@?[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    // const phoneRegex = /(?:\+?(\d{1,3}))?[-. ]?(\d{3})[-. ]?(\d{3})[-. ]?(\d{4})/;

    // const containsEmail = emailRegex.test(message);
    // const containsPhone = phoneRegex.test(message);

    // if (containsEmail) {
    //     console.log('✌️containsEmail --->', containsEmail);
    // }

    // if (containsPhone) {
    //     console.log('✌️phoneRegex --->', containsPhone);
    // }

    const msg = await ChatMessage.create({
        message,
        senderId: userId,
        chatRoomId: chatRoomId,
    })

    const chatRoom = await ChatRoom.findOne({ _id: chatRoomId, isDeleted: 0 })

    if (chatRoom.createdBy.createdById.toString() !== userId) {
        chatRoom.createdBy.unreadCount = chatRoom.createdBy.unreadCount ? chatRoom.createdBy.unreadCount + 1 : 1
    } else {
        chatRoom.member.unreadCount = chatRoom.member.unreadCount ? chatRoom.member.unreadCount + 1 : 1
    }

    chatRoom.lastMessageId = msg._id
    await ChatRoom.updateOne({ _id: chatRoomId }, chatRoom);

    let room = await getSingleRoomDetails(chatRoomId)
    return room

}

const getMessages = async (chatRoomId) => {
    const messages = await ChatMessage.aggregate([
        { $match: { chatRoomId: new mongoose.Types.ObjectId(chatRoomId) } },
        {
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    }]
            }
        },
        { $unwind: "$sender" },
        {
            $project: {
                _id: 1,
                message: 1,
                createdAt: 1,
                sender: 1
            }
        }
    ]);

    return messages
}

const clearUnreadCount = async (userId, chatRoomId) => {
    const room = await ChatRoom.findOne({ _id: chatRoomId });

    if (room.createdBy.createdById.toString() === userId) {
        room.createdBy.unreadCount = 0
    } else {
        room.member.unreadCount = 0
    }

    await ChatRoom.updateOne({ _id: chatRoomId }, room);
    return room
}

const getRooms = async (userId) => {
    const data = await ChatRoom.aggregate([
        {
            $match: {
                $or: [
                    { "createdBy.createdById": new mongoose.Types.ObjectId(userId) },
                    { "member.memberId": new mongoose.Types.ObjectId(userId) }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy.createdById",
                foreignField: "_id",
                as: "createdBy.createdByDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            noOfReviews: 1,
                            rating: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ],
            }
        },
        { $unwind: "$createdBy.createdByDetails" },
        {
            $lookup: {
                from: "users",
                localField: "member.memberId",
                foreignField: "_id",
                as: "member.memberDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                        bannerImages: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            noOfReviews: 1,
                            rating: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ],
            }
        },
        { $unwind: "$member.memberDetails" },
        {
            $lookup: {
                from: "chatmessages",
                localField: "lastMessageId",
                foreignField: "_id",
                as: "lastMessage",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "senderId",
                            foreignField: "_id",
                            as: "sender",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                    bannerImages: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                    bannerImages: 1
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        role: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ],
                        }
                    },
                    { $unwind: "$sender" },
                    {
                        $project: {
                            _id: 1,
                            message: 1,
                            sender: 1,
                        }
                    }

                ]
            }
        },
        {
            $unwind: {
                path: "$lastMessage",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                _id: 1,
                createdBy: 1,
                member: 1,
                status: 1,
                createdAt: 1,
                lastMessage: 1
            }
        }
    ]);

    return data;
}

// apis for chat room
const checkGroup = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { receiverId } = req.body
    if (!receiverId) return response400(res, "receiverId is required.")

    const data = await ChatRoomDetails.aggregate([
        {
            $match: {
                $or: [
                    { userId: new mongoose.Types.ObjectId(userId) },
                    { userId: new mongoose.Types.ObjectId(receiverId) }
                ]
            }
        },
        {
            $group: {
                _id: "$groupId",
                users: { $addToSet: "$userId" }
            }
        },
        {
            $match: {
                users: { $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(receiverId)] }
            }
        },
        {
            $project: {
                _id: 0,
                groupId: "$_id"
            }
        }
    ])

    const result = data.length ? data[0].groupId : null
    return response200(res, "Record fetch successfully.", true, { groupId: result })
});

const createChatRoom = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { receiverId } = req.body
    if (!receiverId) return response400(res, "receiverId is required.")

    const group = await ChatRoom.create({
        groupName: "",
        lastMessage: "",
        createdById: userId
    })

    const data = await ChatRoomDetails.insertMany([
        {
            groupId: group._id,
            userId: userId,
            badge: 0,
        },
        {
            groupId: group._id,
            userId: receiverId,
            badge: 0,
        },
    ])

    return response200(res, "Chat room create successfully.", true, data)
})

const fetchRoom = catchAsyncError(async (req, res) => {

    const userId = req.user
    let groupIds = await ChatRoomDetails.find({ userId })
    groupIds = groupIds.map((val) => val.groupId)

    const data = await ChatRoom.aggregate([
        { $match: { _id: { $in: groupIds } } },
        {
            $lookup: {
                from: "chatroomdetails",
                localField: "_id",
                foreignField: "groupId",
                as: "groupDetails",
                pipeline: [
                    // { $match: { userId: { $ne: new mongoose.Types.ObjectId(userId) } } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        role: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$user",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            groupId: 1,
                            badge: 1,
                            user: 1,
                        }
                    }
                ]
            }
        },
        // {
        //     $unwind: {
        //         path: "$groupDetails",
        //         preserveNullAndEmptyArrays: true
        //     }
        // },
        { $sort: { updatedAt: -1 } },
        {
            $project: {
                _id: 1,
                groupName: 1,
                lastMessage: 1,
                updatedAt: 1,
                groupDetails: 1,
            }
        }
    ])


    return response200(res, "Room details fetch successfully", true, data)
})

const resetBadge = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { groupId } = req.body
    if (!groupId) return response400(res, "groupId is required.")

    await ChatRoomDetails.updateOne({ groupId, userId }, { $set: { badge: 0 } })
    return response200(res, "Badge update successfully")
});

const sendMessages = catchAsyncError(async (req, res) => {
    const userId = req.user;
    const { message, groupId } = req.body
    const newMessage = await ChatMessage.create({
        message,
        chatRoomId: groupId,
        senderId: userId,
    });

    await ChatRoom.updateOne({ _id: groupId }, { $set: { lastMessage: message } });
    await ChatRoomDetails.updateOne({ groupId: groupId, userId: { $ne: userId } },
        { $inc: { badge: 1 } })

    const data = await ChatMessage.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(newMessage._id) } },
        {
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ]
            }
        },
        { $unwind: "$sender" },
        {
            $project: {
                _id: 1,
                chatRoomId: 1,
                message: 1,
                createdAt: 1,
                sender: 1
            }
        }
    ])
    return response200(res, "Message send successfully.", true, data)
});
const fetchMessages = catchAsyncError(async (req, res) => {
    const userId = req.user;
    const { groupId } = req.params


    const data = await ChatMessage.aggregate([
        { $match: { chatRoomId: new mongoose.Types.ObjectId(groupId) } },
        {
            $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "sender",
                pipeline: [
                    {
                        $lookup: {
                            from: "tourists",
                            localField: "_id",
                            foreignField: "userId",
                            as: "touristData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: "tourguides",
                            localField: "_id",
                            foreignField: "userId",
                            as: "tourGuideData",
                            pipeline: [
                                {
                                    $project: {
                                        images: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            role: 1,
                            details: {
                                $cond: {
                                    if: { $eq: ["$role", "tourist"] },
                                    then: { $arrayElemAt: ["$touristData", 0] },
                                    else: { $arrayElemAt: ["$tourGuideData", 0] }
                                }
                            }
                        }
                    },
                ]
            }
        },
        { $unwind: "$sender" },
        {
            $project: {
                _id: 1,
                chatRoomId: 1,
                message: 1,
                createdAt: 1,
                sender: 1
            }
        }
    ])


    return response200(res, "Record fetch successfully.", true, data)
});

const updateSocket = catchAsyncError(async (req, res) => {
    const userId = req.user
    const { socketId } = req.body;
    if (!socketId) return response400(res, "socketId is required.")

    await User.updateOne({ _id: userId }, { $set: { socketId: socketId } })
    return response200(res, "Socket update successfully.")
});

const fetchSocketId = async (userId) => {
    return await User.findOne({ _id: userId });
}

const fetchReceiverGroup = async (id) => {
    let groupIds = await ChatRoomDetails.find({ userId: id })
    groupIds = groupIds.map((val) => val.groupId)

    const data = await ChatRoom.aggregate([
        { $match: { _id: { $in: groupIds } } },
        {
            $lookup: {
                from: "chatroomdetails",
                localField: "_id",
                foreignField: "groupId",
                as: "groupDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "tourists",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "touristData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "tourguides",
                                        localField: "_id",
                                        foreignField: "userId",
                                        as: "tourGuideData",
                                        pipeline: [
                                            {
                                                $project: {
                                                    images: 1,
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        role: 1,
                                        details: {
                                            $cond: {
                                                if: { $eq: ["$role", "tourist"] },
                                                then: { $arrayElemAt: ["$touristData", 0] },
                                                else: { $arrayElemAt: ["$tourGuideData", 0] }
                                            }
                                        }
                                    }
                                },
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$user",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            groupId: 1,
                            badge: 1,
                            user: 1,
                        }
                    }
                ]
            }
        },
        { $sort: { updatedAt: -1 } },
        {
            $project: {
                _id: 1,
                groupName: 1,
                lastMessage: 1,
                updatedAt: 1,
                groupDetails: 1,
            }
        }
    ])
    return data
}
module.exports = {
    createRoom,
    sendMessage,
    getMessages,
    clearUnreadCount,
    getRooms,
    // 
    detectKeyword,
    checkGroup,
    createChatRoom,
    fetchRoom,
    resetBadge,
    sendMessages,
    fetchMessages,
    updateSocket,
    fetchSocketId,
    fetchReceiverGroup
}
