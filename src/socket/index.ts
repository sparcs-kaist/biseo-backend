import http from 'http';
import socket, { Socket } from 'socket.io';
import {
  adminListener,
  chatListener,
  disconnectListener,
  voteListener,
} from './listeners';
import { authMiddleware } from './middlewares';
import { getConnectedMembers } from './utils';
import { accessors } from './mock/accessors';

export default (httpServer: http.Server): void => {
  const io = socket(httpServer);

  // attach auth related properties to socket
  io.use(authMiddleware);

  // main logic of listener socket
  io.on('connection', (socket: Socket) => {
    const { sparcs_id, isAdmin } = socket.user;

    const isNewUser = !(sparcs_id in accessors) || accessors[sparcs_id] === 0;
    const members = getConnectedMembers(accessors);

    if (isNewUser) {
      accessors[sparcs_id] = 1;
      members.push(sparcs_id);
      socket.broadcast.emit('chat:enter', sparcs_id); // broadcast the user's entrance
    } else {
      accessors[sparcs_id] += 1;
    }

    socket.emit('chat:members', members); // send list of members to new user
    socket.emit('chat:name', sparcs_id); // send username to new user

    // listen for chats
    chatListener(io, socket);

    // listen for votes
    voteListener(io, socket);

    // listen to disconnect event
    disconnectListener(io, socket);

    // only attach admin listener to admins
    if (isAdmin) adminListener(io, socket);
  });
};
