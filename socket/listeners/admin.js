import Agenda from '../../models/agenda';

/*
 * adminListener - register 'admin:create' event to socket
 *   the 'admin:create' event is sent to the server socket when an administrator
 *   creates a new agenda item. the admin will send a payload, which is an object
 *   that has 4 members: title, content, subtitle, choices. refer to the Agenda schema
 *   for further information on these members.
 *
 *   this event listener creates a new agenda and broadcasts the created agenda to all
 *   client sockets.
 */
export const adminListener = (io, socket) => {
    socket.on('admin:create', async (payload, callback) => {
        // payload has 4 fields. title, content, subtitle, choices
        const currentTime = Date.now();
        // agenda lasts for 3 minutes. this value is arbitrary and temporary
        const validDuration = 3 * 60 * 1000;

        // all choices are initialized with a vote count of 0
        const votesCountMap = new Map(
            payload.choices.map(choice => [choice, 0])
        );

        const newAgenda = new Agenda({
            ...payload,
            votesCountMap,
            expires: new Date(currentTime + validDuration)
        });

        const result = await newAgenda.save().catch(error => {
            console.error('Error while inserting new vote');
            callback({ success: false, message: error.message });
        });

        if (!result) {
            callback({ success: false });
            return;
        }

        const { _id, title, content, subtitle, expires, choices } = result;
        io.emit('agenda:created', {
            _id,
            title,
            content,
            subtitle,
            choices,
            expires
        });
        callback({ success: true });
    });
};
