module.exports.emitRoom = (io, members, result, exclude = []) => {
    const payload = result
    members.forEach(val => {
        if (exclude.indexOf(val.toString()) === -1) {
            this.emitToUser(io, val, 'chat_room', {
                chat_room: payload
            })
        }
    })
}
module.exports.emitToUser = async (io, userId, type, payload) => {
    io.emit(`user_${userId}`, JSON.stringify({ type, ...payload }))
}