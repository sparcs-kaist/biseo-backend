import http from 'http';
import socket from 'socket.io';
import {
    registerDisconnect,
    registerChatMessage,
    registerAdminCreate
} from './register';
import { authMiddleware } from './middlewares';
import { getConnectedMembers } from './utils';

const accessors = {};

// initialize and run socket server
const socketServer = http.createServer();
const io = socket(socketServer);

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

    registerDisconnect(socket, accessors, username);
    registerChatMessage(socket, username);

    if (!isAdmin) return;

    // only attach admin listener to admins
    registerAdminCreate(socket, io);
});

export default socketServer;
