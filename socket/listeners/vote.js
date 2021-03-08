import Vote from '../../models/vote';
import Agenda from '../../models/agenda';
import { startSession } from 'mongoose';

export const voteListener = (io, socket) => {
  socket.on('agenda:vote', async (payload, callback) => {
    // payload has 1 field. choice
    const { username } = socket.request;
    const { agendaId, choice } = payload;

    const session = await startSession();
    try {
      session.startTransaction();

      await Vote.create({ agendaId, username, choice });

      const agenda = await Agenda.findOne({ _id: agendaId });
      if (!agenda.votesCountMap.has(choice))
        throw new Error(`Invalid Choice: ${choice} is not a votable choice`);

      // increment votesCountMap count
      agenda.votesCountMap.set(choice, agenda.votesCountMap.get(choice) + 1);
      await agenda.save();

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      callback({ success: false, message: error.message });
      return;
    }

    io.emit('agenda:voted', {
      agendaId,
      choice,
    });
    callback({ success: true });
  });
};
