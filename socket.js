import jwt from 'jsonwebtoken';

/*
 * This file defines socket events for chatting and exports `initializeSocket`,
 * a function that registers handlers for all socket events defined here.
 *
 * The following are socket events defined in this file:
 *      members:         sent to a new user when a new user connects to this socket server.
 *                       a list of strings containing the current connected users are sent.
 *                       this is ONLY sent to the new user.
 *
 *      name:            sent to a new user when a new user connects to this socket server.
 *                       a single string literal is sent.
 *                       this is ONLY sent to the new user.
 *
 *      enter:           sent to other users when a new user connects to this socket server.
 *                       the name of the user is sent.
 *                       this is ONLY sent to other users
 *
 *      out:             sent to other users when a user disconnects from this socket server.
 *
 *      chat message:    sent to other users when a user sends a message to this socket server.
 */

const randomNames = [
    'Jack',
    'Lukas',
    'James',
    'Oliver',
    'Sophia',
    'Emma',
    'Aria',
    'Amelia'
]; // SSO 로그인 구현 전 임시 유저 배열
const accessors = {};

const getUsername = token => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.sparcs_id;
    } catch (err) {
        return randomNames[Math.floor(Math.random() * randomNames.length)];
    }
};

const getConnectedMembers = () =>
    Object.keys(accessors).filter(user => accessors[user] > 0);

const registerSocketDisconnect = (socket, username) => {
    socket.on('disconnect', () => {
        if (!accessors.hasOwnProperty(username) || accessors[username] === 0)
            // something's wrong
            return;

        accessors[username] -= 1;
        if (accessors[username] > 0)
            // no need to broadcast. user is still here
            return;

        const members = getConnectedMembers();
        socket.broadcast.emit('members', members); // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
        socket.broadcast.emit('out', username); // 전체 유저에게 누가 나갔는지 보내줌
    });
};

const registerSocketChatMessage = (socket, username) => {
    socket.on('chat message', message => {
        socket.broadcast.emit('chat message', username, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
    });
};

const initializeSocket = io => {
    io.on('connection', socket => {
        const user = getUsername(socket.handshake.query['token']);

        const isNewUser =
            !accessors.hasOwnProperty(user) || accessors[user] === 0;
        const members = getConnectedMembers();

        if (isNewUser) {
            accessors[user] = 1;
            members.push(user);
            socket.broadcast.emit('enter', user); // broadcast the user's entrance
        } else {
            accessors[user] += 1;
        }

        socket.emit('members', members); // send list of members to new user
        socket.emit('name', user); // send username to new user

        registerSocketDisconnect(socket, user);
        registerSocketChatMessage(socket, user);
    });
};

export default initializeSocket;
