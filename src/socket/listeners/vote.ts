import { Server, Socket } from 'socket.io';
import { startSession } from 'mongoose';
import { SuccessStatusResponse } from '@/common/types';
import Agenda, { AgendaDocument } from '@/models/agenda';
import { AgendaStatus } from '@/common/enums';
import Vote from '@/models/vote';

interface AgendaVotePayload {
  agendaId: string;
  choice: string;
}

interface AgendaPPLPayload {
  agendaId: string;
}

type AdminCreateCallback = (response: SuccessStatusResponse) => void;

export const voteListener = (io: Server, socket: Socket): void => {
  socket.on(
    'agenda:vote',
    async (payload: AgendaVotePayload, callback: AdminCreateCallback) => {
      const { uid, sparcs_id: username } = socket.user;
      const { agendaId, choice } = payload;

      const session = await startSession();
      const agenda = await Agenda.findOne({ _id: agendaId });
      try {
        session.startTransaction();

        await Vote.create({ agendaId, uid, username, choice });

        if (
          agenda === null ||
          !agenda.votesCountMap.has(choice) ||
          agenda.status !== AgendaStatus.PROGRESS
        )
          throw new Error(`Invalid Choice: ${choice} is not a votable choice`);

        if (!agenda.participants.includes(username))
          throw new Error('You are not registered user for this vote.');

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
      });

      callback({ success: true });
    }
  );
  socket.on(
    'agenda:status',
    async (payload: AgendaPPLPayload, callback: AdminCreateCallback) => {
      const { isAdmin } = socket.user;
      const { agendaId } = payload;
      const agenda = await Agenda.findOne({ _id: agendaId });
      if (agenda === null) {
        callback({ success: false, payload: 'Agenda not found' });
        return;
      }

      if (isAdmin) {
        const { participants } = agenda;

        const voteInfo = await Vote.find({ agendaId: agenda._id });
        const voterNames = voteInfo.map(({ username }) => username);

        const pplWhoDidNotVote = participants.filter(
          name => !voterNames.includes(name)
        );

        callback({
          success: true,
          payload: {
            pplWhoDidNotVote,
            agendaId,
            agendaTitle: agenda.title,
            isExpired: agenda.checkStatus() === AgendaStatus.TERMINATE,
          },
        });
      } else {
        callback({ success: false, payload: 'No permission' });
      }
    }
  );
};
