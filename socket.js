import jwt from 'jsonwebtoken'

const username = ["Jack", "Lukas", "James", "Oliver", "Sophia", "Emma", "Aria", "Amelia"] // SSO 로그인 구현 전 임시 유저 배열
let accessors = [] // 접속자 배열

module.exports = io => {
    io.on('connection', socket => {
        let decoded = ''
        try {
            decoded = jwt.verify(socket.handshake.query['token'], process.env.JWT_SECRET)
        } catch (err) {}
        const user = decoded.sparcs_id || username[Math.floor(Math.random() * username.length)]  // 랜덤 유저 이름 추출 (역시나 임시적)
        accessors.push(user)

        io.to(socket.id).emit('name', user) // 접속한 유저에게 랜덤으로 추출된 이름을 보내줌

        socket.broadcast.emit('enter', user) // 전체 유저에게 누가 들어왔는지 보내줌

        socket.emit('members', accessor)
        socket.broadcast.emit('members', accessor)

        socket.on('disconnect', () => {
            let idx = accessor.indexOf(user)
            if (idx > -1) accessor.splice(idx, 1) // disconnect된 유저이름의 index 찾아서 접속자 배열에서 지움

            socket.broadcast.emit('members', accessor) // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
            socket.broadcast.emit('out', user) // 전체 유저에게 누가 나갔는지 보내줌
        })

        socket.on('chat message', message => {
            socket.broadcast.emit('chat message', user, message) // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
        })
    });
};

