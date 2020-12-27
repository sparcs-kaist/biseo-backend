/*
 * this file defines functions that attach event listeners to a socket.
 */

import { getConnectedMembers } from './utils';
import Vote from '../models/vote';

/*
 * registerConnect - register 'disconnect' event to socket
 *   upon disconnection, modify the `accessors` variable and send appropriate events
 */
export const registerDisconnect = (socket, accessors, username) => {
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

/*
 * registerChatMessage - register 'chat:message' event to socket
 */
export const registerChatMessage = (socket, username) => {
    socket.on('chat:message', message => {
        socket.broadcast.emit('chat:message', username, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
    });
};

/*
 * registerAdminCreate - register 'admin:create' event to socket
 *   the 'admin:create' event is sent to the server socket when an administrator
 *   creates a new vote item. the admin will send a payload, which is an object
 *   that has 4 members: title, content, subtitle, choices. refer to the Vote schema
 *   for further information on these members.
 *
 *   this event listener creates a new vote and broadcasts the created vote to all
 *   client sockets.
 */
export const registerAdminCreate = (socket, io) => {
    socket.on('admin:create', async (payload, callback) => {
        // payload has 4 members. title, content, subtitle, choices
        const currentTime = Date.now();

        // vote lasts for 3 minutes. this value is arbitrary and temporary
        const validDuration = 3 * 60 * 1000;

        const newVoteItem = new Vote({
            ...payload,
            submissions: [],
            expires: new Date(currentTime + validDuration)
        });

        const result = await newVoteItem.save().catch(() => {
            console.error('Error while inserting new vote');
            callback({ success: false });
        });

        if (!result) {
            callback({ success: false });
            return;
        }
        callback({ success: true });

        const { _id, title, content, subtitle, choices, expires } = result;
        io.emit('vote:created', {
            _id,
            title,
            content,
            subtitle,
            choices,
            expires
        });
    });
};
