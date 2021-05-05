import { Server, Socket } from 'socket.io';
import { startSession } from 'mongoose';
import { SuccessStatusResponse } from '@/common/types';
import Agenda from '@/models/agenda';
import { AgendaStatus } from '@/common/enums';
import Vote from '@/models/vote';

interface AgendaVotePayload {
  agendaId: string;
  choice: string;
}

type AdminCreateCallback = (response: SuccessStatusResponse) => void;

export const voteListener = (io: Server, socket: Socket): void => {
  socket.on(
    'agenda:vote',
    async (payload: AgendaVotePayload, callback: AdminCreateCallback) => {
      const { username } = socket.request;
      const { agendaId, choice } = payload;

      const session = await startSession();
      try {
        session.startTransaction();

        await Vote.create({ agendaId, username, choice });

        const agenda = await Agenda.findOne({ _id: agendaId });
        if (
          agenda === null ||
          !agenda.votesCountMap.has(choice) ||
          agenda.status != AgendaStatus.PROGRESS
        )
          throw new Error(`Invalid Choice: ${choice} is not a votable choice`);

        // increment votesCountMap count
        agenda.votesCountMap.set(
          choice,
          (agenda.votesCountMap.get(choice) as number) + 1
        );
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
    }
  );
};
