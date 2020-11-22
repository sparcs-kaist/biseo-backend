import jwt from 'jsonwebtoken';
import Vote from './models/vote';

/*
 * This file defines socket events for chatting and exports `initializeSocket`,
 * a function that registers handlers for all socket events defined here.
 *
 * The following are socket events defined in this file:
 *      "chat:members":     sent to a new user when a new user connects to this socket server.
 *                          a list of strings containing the current connected users are sent.
 *                          this is ONLY sent to the new user.
 *
 *      "chat:name":        sent to a new user when a new user connects to this socket server.
 *                          a single string literal is sent.
 *                          this is ONLY sent to the new user.
 *
 *      "chat:enter":       sent to other users when a new user connects to this socket server.
 *                          the name of the user is sent.
 *                          this is ONLY sent to other users
 *
 *      "chat:out":         sent to other users when a user disconnects from this socket server.
 *
 *      "chat:message":     sent to other users when a user sends a message to this socket server.
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

/*
 * getUserInformation - extract user information from JWT(JSON Web Token)
 *  this function returns an object that has two keys:
 *  {
 *      username: user's nickname for chat. either SPARCS nickname or random
 *      isAdmin: boolean value indicating whether this user is admin
 *  }
 */
const getUserInformation = token => {
    try {
        const { sparcs_id, isAdmin } = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        return { username: sparcs_id, isAdmin };
    } catch (err) {
        return {
            username:
                randomNames[Math.floor(Math.random() * randomNames.length)],
            isAdmin: false
        };
    }
};

const getConnectedMembers = () =>
    Object.keys(accessors).filter(user => accessors[user] > 0);

const registerSocketDisconnect = (socket, username) => {
    socket.on('disconnect', () => {
        if (!(username in accessors) || accessors[username] === 0)
            // something's wrong
            return;

        accessors[username] -= 1;
        if (accessors[username] > 0)
            // no need to broadcast. user is still here
            return;

        const members = getConnectedMembers();
        socket.broadcast.emit('chat:members', members); // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
        socket.broadcast.emit('chat:out', username); // 전체 유저에게 누가 나갔는지 보내줌
    });
};

const registerSocketChatMessage = (socket, username) => {
    socket.on('chat:message', message => {
        socket.broadcast.emit('chat:message', username, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
    });
};

const initializeSocket = io => {
    io.on('connection', socket => {
        const { username, isAdmin } = getUserInformation(
            socket.handshake.query['token']
        );
        socket.isAdmin = isAdmin;

        const isNewUser = !(username in accessors) || accessors[username] === 0;
        const members = getConnectedMembers();

        if (isNewUser) {
            accessors[username] = 1;
            members.push(username);
            socket.broadcast.emit('chat:enter', username); // broadcast the user's entrance
        } else {
            accessors[username] += 1;
        }

        socket.emit('chat:members', members); // send list of members to new user
        socket.emit('chat:name', username); // send username to new user

        registerSocketDisconnect(socket, username);
        registerSocketChatMessage(socket, username);

        socket.on('admin:create', async payload => {
            // payload has 4 keys. title, content, subtitle, choices
            const currentTime = Date.now();

            // vote lasts for 3 minutes. this value is arbitrary and temporary
            const validDuration = 3 * 60 * 1000;

            const newVoteItem = new Vote({
                ...payload,
                submissions: [],
                expires: new Date(currentTime + validDuration)
            });

            const result = await newVoteItem
                .save()
                .catch(() => console.error('Error while inserting new vote'));

            if (!result) return;

            io.emit('vote:created', {
                id: result._id,
                title: result.title,
                content: result.content,
                subtitle: result.subtitle,
                choices: result.choices,
                expires: result.expires
            });
        });
    });
};

export default initializeSocket;
