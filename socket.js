import jwt from 'jsonwebtoken'

const randomNames = ["Jack", "Lukas", "James", "Oliver", "Sophia", "Emma", "Aria", "Amelia"] // SSO 로그인 구현 전 임시 유저 배열
const accessors = [] // 접속자 배열

const getUsername = token => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        return decoded.sparcs_id
    } catch (err) {
        return randomNames[Math.floor(Math.random() * randomNames.length)]
    }
}

const registerSocketDisconnect = socket => {
    socket.on('disconnect', () => {
        const idx = accessors.indexOf(user)
        if (idx > -1) accessors.splice(idx, 1) // disconnect된 유저이름의 index 찾아서 접속자 배열에서 지움

        socket.broadcast.emit('members', accessors) // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
        socket.broadcast.emit('out', user) // 전체 유저에게 누가 나갔는지 보내줌
    })
}

const registerSocketChatMessage = socket => {
    socket.on('chat message', message => {
        socket.broadcast.emit('chat message', user, message) // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
    })
}

const onIoConnection = socket => {
    const user = getUsername(socket.handshake.query['token'])

    if (!accessors.includes(user))
        accessors.push(user)

    socket.emit('members', accessors)           // send list of members to the user
    socket.broadcast.emit('members', accessors) // send list of members to other users

    io.to(socket.id).emit('name', user)         // send username to the user
    socket.broadcast.emit('enter', user)        // broadcast the user's entrance

    registerSocketDisconnect(socket)
    registerSocketChatMessage(socket)
}

export default io => io.on('connection', onIoConnection)
