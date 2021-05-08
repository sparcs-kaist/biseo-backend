import { Server, Socket } from 'socket.io';
import { SuccessStatusResponse } from '@/common/types';
import { AgendaStatus } from '@/common/enums';
import Agenda, { BaseAgenda, AgendaDocument } from '@/models/agenda';
import agenda from '@/models/agenda';

type AdminCreatePayload = Pick<
  BaseAgenda,
  'title' | 'content' | 'subtitle' | 'choices' | 'status'
>;

type AdminCreateCallback = (response: SuccessStatusResponse) => void;
type AdminExpireCallback = (response: SuccessStatusResponse) => void;

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
export const adminListener = (io: Server, socket: Socket): void => {
  socket.on(
    'admin:create',
    async (payload: AdminCreatePayload, callback: AdminCreateCallback) => {
      // payload has 4 fields. title, content, subtitle, choices
      const currentTime = Date.now();
      // agenda lasts for 3 minutes. this value is arbitrary and temporary
      const validDuration = 3 * 60 * 60 * 1000;

      // all choices are initialized with a vote count of 0
      const votesCountMap = new Map(payload.choices.map(choice => [choice, 0]));

      const newAgenda = new Agenda({
        ...payload,
        votesCountMap,
        status: AgendaStatus.PREPARE,
        createDate: Date.now(),
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
      } = result;
      io.emit('agenda:created', {
        _id,
        title,
        content,
        subtitle,
        choices,
        status,
        expires,
      });
      callback({ success: true });
    }
  );

  socket.on(
    'admin:expires',
    async (payload: String, callback: AdminExpireCallback) => {
      const agenda = await Agenda.findById(payload);
      if (agenda == null || agenda.status != AgendaStatus.PROGRESS) {
        callback({ success: false });
        return;
      }

      agenda.expires = new Date(Date.now());

      console.log(agenda);

      const result = await agenda.save().catch(error => {
        console.error('Error while expiring vote');
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
      } = result;
      io.emit('agenda:expired', {
        _id,
        title,
        content,
        subtitle,
        choices,
        status,
        expires,
        createDate,
        votesCountMap,
      });
      callback({ success: true });
    }
  );

  socket.on(
    'admin:start',
    async (payload: String, callback: AdminExpireCallback) => {
      const agenda = await Agenda.findById(payload);
      if (agenda == null || agenda.status != AgendaStatus.PREPARE) {
        callback({ success: false });
        return;
      }

      agenda.status = AgendaStatus.PROGRESS;

      console.log(agenda);

      const result = await agenda.save().catch(error => {
        console.error('Error while Start vote');
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
      } = result;
      io.emit('agenda:started', {
        _id,
        title,
        content,
        subtitle,
        choices,
        status,
        expires,
        createDate,
        votesCountMap,
      });
      callback({ success: true });
    }
  );
};
