import http from 'http';
import socket from 'socket.io';
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
  io.on('connection', socket => {
    const { username, isAdmin } = socket.request;

    const isNewUser = !(username in accessors) || accessors[username] === 0;
    const members = getConnectedMembers(accessors);

    if (isNewUser) {
      accessors[username] = 1;
      members.push(username);
      socket.broadcast.emit('chat:enter', username); // broadcast the user's entrance
    } else {
      accessors[username] += 1;
    }

    socket.emit('chat:members', members); // send list of members to new user
    socket.emit('chat:name', username); // send username to new user

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
