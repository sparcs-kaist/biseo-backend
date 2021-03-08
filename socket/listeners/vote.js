import Vote from '../../models/vote';
import Agenda from '../../models/agenda';
import { startSession } from 'mongoose';

export const voteListener = (io, socket) => {
    socket.on('agenda:vote', async (payload, callback) => {
        // payload has 1 field. choice
        const { username } = socket.request;
        const { agenda, choice } = payload;

        const session = await startSession();
        try {
            session.startTransaction();

            await Vote.create({ agenda, username, choice });

            const agenda = await Agenda.findOne({ _id: agenda });
            if (!agenda.voteCountMap.has(choice))
                throw new Error(
                    `Invalid Choice: ${choice} is not a votable choice`
                );

            // increment voteCountMap count
            agenda.voteCountMap.set(
                choice,
                agenda.voteCountMap.get(choice) + 1
            );
            await agenda.save();

            await session.commitTransaction();
            session.endSession();
        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            callback({ success: false, message: err.message });
            return;
        }

        io.emit('agenda:voted', {
            agenda,
            choice
        });
        callback({ success: true });
    });
};
