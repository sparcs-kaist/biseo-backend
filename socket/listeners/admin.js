import Vote from '../../models/vote';

/*
 * adminListener - register 'admin:create' event to socket
 *   the 'admin:create' event is sent to the server socket when an administrator
 *   creates a new vote item. the admin will send a payload, which is an object
 *   that has 4 members: title, content, subtitle, choices. refer to the Vote schema
 *   for further information on these members.
 *
 *   this event listener creates a new vote and broadcasts the created vote to all
 *   client sockets.
 */
export const adminListener = (io, socket) => {
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
