import { Server, Socket } from 'socket.io';

/*
 * chat - register 'chat:message' event to socket
 */
export const chatListener = (io: Server, socket: Socket): void => {
  socket.on('chat:message', (message: string) => {
    socket.broadcast.emit('chat:message', socket.user.sparcs_id, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
  });
};
