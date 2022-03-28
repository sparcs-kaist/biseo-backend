import { Server, Socket } from 'socket.io';
import { SuccessStatusResponse } from '@/common/types';
import { AgendaStatus } from '@/common/enums';
import Agenda, { BaseAgenda } from '@/models/agenda';

type AdminCreatePayload = Pick<
  BaseAgenda,
  'title' | 'content' | 'subtitle' | 'choices' | 'status' | 'participants'
>;

type AdminAgendaCallback = (response: SuccessStatusResponse) => void;

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
export const adminListener = (
  io: Server,
  socket: Socket,
  socketIds: { [key: string]: Set<string> },
  adminSocketIds: Set<string>
): void => {
  socket.on(
    'admin:create',
    async (payload: AdminCreatePayload, callback: AdminAgendaCallback) => {
      // payload has 4 fields. title, content, subtitle, choices
      const currentTime = Date.now();
      // agenda lasts for 3 hours. this value is arbitrary and temporary
      const validDuration = 3 * 60 * 60 * 1000;

      // all choices are initialized with a vote count of 0
      const votesCountMap = new Map(payload.choices.map(choice => [choice, 0]));

      const newAgenda = new Agenda({
        ...payload,
        votesCountMap,
        status: AgendaStatus.PREPARE,
        createDate: new Date(Date.now()),
        expires: new Date(currentTime + validDuration),
      });

      const result = await newAgenda.save().catch(error => {
        console.error('Error while inserting new vote');
        callback({ success: false, message: error.message });
      });

      if (!result) {
        callback({ success: false });
        return;
      }

      const {
        _id,
        title,
        content,
        subtitle,
        status,
        expires,
        choices,
        participants,
      } = result;

      emitAdmin(adminSocketIds, io, 'agenda:created', {
        _id,
        title,
        content,
        subtitle,
        choices,
        status,
        expires,
        participants,
      });

      callback({ success: true });
    }
  );

  socket.on(
    'admin:terminates',
    async (payload: string, callback: AdminAgendaCallback) => {
      const agenda = await Agenda.findById(payload);

      if (agenda === null || agenda.checkStatus() !== AgendaStatus.PROGRESS) {
        callback({ success: false });
        return;
      }

      agenda.expires = new Date(Date.now());

      const result = await agenda.save().catch(error => {
        console.error('Error while terminating agenda');
        callback({ success: false, message: error.message });
      });

      if (!result) {
        callback({ success: false });
        return;
      }

      const {
        _id,
        title,
        content,
        subtitle,
        status,
        expires,
        choices,
        createDate,
        votesCountMap,
        participants,
      } = result;

      emitParticipantsAndAdmin(
        agenda.participants,
        socketIds,
        adminSocketIds,
        io,
        'agenda:terminated',
        {
          _id,
          title,
          content,
          subtitle,
          choices,
          status,
          expires,
          createDate,
          votesCountMap,
          participants,
        }
      );

      callback({ success: true });
    }
  );

  socket.on(
    'admin:start',
    async (payload: string, callback: AdminAgendaCallback) => {
      const agenda = await Agenda.findById(payload);

      if (agenda === null || agenda.checkStatus() !== AgendaStatus.PREPARE) {
        callback({ success: false });
        return;
      }

      agenda.status = AgendaStatus.PROGRESS;

      const result = await agenda.save().catch(error => {
        console.error('Error while starting agenda');
        callback({ success: false, message: error.message });
      });

      if (!result) {
        callback({ success: false });
        return;
      }

      const {
        _id,
        title,
        content,
        subtitle,
        status,
        expires,
        choices,
        createDate,
        votesCountMap,
        participants,
      } = result;

      emitParticipantsAndAdmin(
        agenda.participants,
        socketIds,
        adminSocketIds,
        io,
        'agenda:started',
        {
          _id,
          title,
          content,
          subtitle,
          choices,
          status,
          expires,
          createDate,
          votesCountMap,
          participants,
        }
      );

      callback({ success: true });
    }
  );

  socket.on(
    'admin:edit',
    async (
      agendaId: string,
      payload: AdminCreatePayload,
      callback: AdminAgendaCallback
    ) => {
      const agenda = await Agenda.findById(agendaId);

      if (agenda === null || agenda.checkStatus() !== AgendaStatus.PREPARE) {
        callback({ success: false });
        return;
      }

      agenda.title = payload.title;
      agenda.content = payload.content;
      agenda.subtitle = payload.subtitle;
      agenda.choices = payload.choices;
      agenda.participants = payload.participants;

      const result = await agenda.save().catch(error => {
        console.error('Error while starting agenda');
        callback({ success: false, message: error.message });
      });

      if (!result) {
        callback({ success: false });
        return;
      }

      const {
        _id,
        title,
        content,
        subtitle,
        status,
        expires,
        choices,
        createDate,
        votesCountMap,
        participants,
      } = result;

      emitParticipantsAndAdmin(
        agenda.participants,
        socketIds,
        adminSocketIds,
        io,
        'agenda:edited',
        {
          _id,
          title,
          content,
          subtitle,
          choices,
          status,
          expires,
          createDate,
          votesCountMap,
          participants,
        }
      );

      callback({ success: true });
    }
  );

  socket.on(
    'admin:delete',
    async (payload: string, callback: AdminAgendaCallback) => {
      const agenda = await Agenda.findById(payload);

      if (agenda === null || agenda.checkStatus() === AgendaStatus.PROGRESS) {
        callback({ success: false });
        return;
      }

      const result = await Agenda.deleteOne({ _id: payload }, error => {
        if (error) {
          console.error('Error while deleting agenda');
          callback({ success: false, message: error.message });
        }
      });

      if (!result.ok) {
        console.log(result);
        callback({ success: false });
        return;
      }

      emitParticipantsAndAdmin(
        agenda.participants,
        socketIds,
        adminSocketIds,
        io,
        'agenda:deleted',
        payload
      );

      callback({ success: true });
    }
  );
};

function emitParticipantsAndAdmin(
  participants: string[],
  socketIds: { [key: string]: Set<string> },
  adminSocketIds: Set<string>,
  io: Server,
  message: string,
  payload: any
) {
  participants.map(participant => {
    if (participant in socketIds) {
      socketIds[participant].forEach(socket_id => {
        if (!adminSocketIds.has(socket_id))
          io.to(socket_id).emit(message, payload);
      });
    }
  });
  emitAdmin(adminSocketIds, io, message, payload);
}

function emitAdmin(
  adminSocketIds: Set<string>,
  io: Server,
  message: string,
  payload: any
) {
  adminSocketIds.forEach(socket_id => {
    io.to(socket_id).emit(message, payload);
  });
}
