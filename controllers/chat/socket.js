const jwt = require("jsonwebtoken");
const { createRoom, sendMessage, getMessages, getRooms, clearUnreadCount, fetchSocketId, fetchReceiverGroup } = require("./chat");
const { emitRoom, emitToUser } = require("./common")


module.exports.setupConnection = async (io, socket) => {
    // const token = socket?.handshake?.headers?.authorization;
    // let userId = null;

    // if (token) {
    //     try {
    //         const decoded = jwt.verify(token, process.env.JWT_SEC);
    //         userId = decoded._id;
    //         emitToUser(io, userId, 'connect', { message: "Socket connected" })
    //     } catch (err) {
    //         console.log(err)
    //     }
    // }

    // socket.on('create-chat-room', async (data) => {
    //     let req = JSON.parse(data)
    //     const result = await createRoom(userId, req)
    //     const members = [req.member, userId]
    //     emitRoom(io, members, result)
    // })

    // socket.on('send-message', async (data) => {
    //     let req = JSON.parse(data)
    //     const room = await sendMessage(userId, req)
    //     const members = [room.createdBy.createdById, room.member.memberId]
    //     emitRoom(io, members, room, [userId])
    // })

    // socket.on('get-message', async (data) => {
    //     const { chatRoomId } = JSON.parse(data)
    //     getMessages(chatRoomId).then(messages => {
    //         emitToUser(io, userId, 'messages', { messages })
    //     })
    // })

    // socket.on('clear-unread-count', function (data) {
    //     const { chatRoomId } = JSON.parse(data)
    //     clearUnreadCount(userId, chatRoomId).then(chatRoom => {
    //         emitToUser(io, userId, 'clear_unread_count', { chatRoom })
    //     })
    // })

    // socket.on('get-all-chat-room', function () {
    //     getRooms(userId).then((data) => {
    //         emitToUser(io, userId, 'chat_rooms', { data })
    //     })
    // })

    // In below socket events just data get and emit here is no any database level operation, For database operation created apis are used by front side.
    socket.on("JOIN ROOM", (data) => {
        const { roomId } = JSON.parse(data)
        if (roomId) {
            socket.join(roomId);
        }
    });

    socket.on("LEAVE ROOM", (data) => {
        const { roomId } = JSON.parse(data)
        socket.leave(roomId);
    });

    socket.on("SEND MESSAGE", async (data) => {
        const payload = JSON.parse(data)
        const { groupId, receiverId } = payload

        io.in(`${groupId}`).emit(
            "RECEIVER",
            {
                payload,
                type: "RECEIVE MESSAGE",
            }
        );

        const receiverSocketId = await fetchSocketId(receiverId);
        if (receiverSocketId?.socketId) {
            const list = await fetchReceiverGroup(receiverId);
            io.to(receiverSocketId?.socketId).emit(
                "RECEIVER",
                {
                    type: "SIDEBAR",
                    sidebar: list,
                }
            );
        }
    });

    socket.on("TYPING", async (data) => {
        const payload = JSON.parse(data)
        const { receiverId } = payload;
        const receiverSocketId = await fetchSocketId(receiverId);
        if (receiverSocketId?.socketId) {
            io.to(receiverSocketId?.socketId).emit(
                "RECEIVER",
                {
                    type: "TYPING",
                    payload,
                }
            );
        }
    });

    socket.on("SIDEBAR", async (data) => {
        const payload = JSON.parse(data)
        const { userId } = payload;
        const receiverSocketId = await fetchSocketId(userId);
        if (receiverSocketId?.socketId) {
            const list = await fetchReceiverGroup(userId);
            io.to(receiverSocketId?.socketId).emit(
                "RECEIVER",
                {
                    type: "SIDEBAR",
                    sidebar: list,
                }
            );
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
}
