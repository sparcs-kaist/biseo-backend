/*
 * chat - register 'chat:message' event to socket
 */
export const chatListener = (io, socket) => {
    socket.on('chat:message', message => {
        socket.broadcast.emit('chat:message', socket.request.username, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
    });
};
