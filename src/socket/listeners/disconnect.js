import { getConnectedMembers } from '../utils';
import { accessors } from '../mock/accessors';

/*
 * disconnectListener - register 'disconnect' event to socket
 *   upon disconnection, modify the `accessors` variable and send appropriate events
 */
export const disconnectListener = (io, socket) => {
  const { username } = socket.request;

  socket.on('disconnect', () => {
    if (!(username in accessors) || accessors[username] === 0)
      // something's wrong
      return;

    accessors[username] -= 1;
    if (accessors[username] > 0)
      // no need to broadcast. user is still here
      return;

    const members = getConnectedMembers(accessors);
    socket.broadcast.emit('chat:members', members); // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
    socket.broadcast.emit('chat:out', username); // 전체 유저에게 누가 나갔는지 보내줌
  });
};
