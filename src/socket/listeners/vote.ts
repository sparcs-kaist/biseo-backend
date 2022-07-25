import { Server, Socket } from 'socket.io';
import { startSession } from 'mongoose';
import { SuccessStatusResponse } from '@/common/types';
import Agenda from '@/models/agenda';
import { AgendaStatus } from '@/common/enums';
import Vote from '@/models/vote';
import User from '@/models/user';
import { getErrorMessage } from '@/utils/error';

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
        if (
          agenda === null ||
          !agenda.votesCountMap.has(choice) ||
          agenda.status !== AgendaStatus.PROGRESS
        )
          throw new Error(`Invalid Choice: ${choice} is not a votable choice`);

        if (!agenda.participants.includes(username))
          throw new Error('You are not registered user for this vote.');

        // prevent multiple voting
        const voteInfo = await Vote.find({ agendaId: agenda._id });
        const voterUids = voteInfo.map(({ uid }) => uid);
        if (voterUids.includes(uid)) throw new Error('You already voted');

        session.startTransaction();
        await Vote.create({ agendaId, uid, username, choice });

        // increment votesCountMap count
        agenda.votesCountMap.set(
          choice,
          // eslint-disable-next-line prettier/prettier
          [...(agenda.votesCountMap.get(choice) as string[]), username]
        );
        await agenda.save();

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        callback({ success: false, message: getErrorMessage(error) });
        return;
      }

      io.emit('agenda:voted', {
        agendaId,
        username,
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
        const voterUsername = voteInfo.map(({ username }) => username);

        let pplWhoDidNotVote = participants.filter(
          sparcs_id => !voterUsername.includes(sparcs_id)
        );
        pplWhoDidNotVote = await Promise.all(
          pplWhoDidNotVote.map(async sparcs_id => {
            const user = await User.findOne({ sparcs_id });
            if (user === null) {
              return sparcs_id;
            } else {
              return user.sparcsId;
            }
          })
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
