import { Server, Socket } from 'socket.io';
import { ObjectId } from 'mongodb';
import Chat from '@/models/chat';
import User from '@/models/user';
import IORedis from 'ioredis';

/*
 * chat - register 'chat:message' event to socket
 */

const CHATMAXLENGTH = 500;

export enum MessageEnum {
  NEW = 'new',
  MEMBERS = 'members',
  MESSAGE = 'message',
  OUT = 'out',
  DELETED = 'deleted',
}

type messageType = {
  _id: string,
  type: MessageEnum;
  message: string;
  username: string,
  date: string;
};

export const chatListener = (
  io: Server,
  socket: Socket,
  redisClient: IORedis.Redis
): void => {
  /* send list of members to new user */
  socket.on('chat:members', async () => {
    const keys: string[] = await redisClient.hkeys('memberStates');
    const _chatMemberState = await Promise.all(
      keys.map(async key => {
        const memberState = await redisClient.hget('memberStates', key);
        const user = await User.findOne({ uid: key });
        if (user === null) return { sparcsId: key, state: memberState };
        else return { sparcsId: user?.sparcsId, state: memberState };
      })
    );

    socket.emit('chat:members', _chatMemberState);
  });

  socket.on('chat:message', async (message: messageType) => {
    if (message.message.length > CHATMAXLENGTH) {
      message.message = message.message.substring(0, CHATMAXLENGTH);
    }

    const msg = await Chat.create({
      type: MessageEnum.MESSAGE,
      message: message.message,
      username: socket.user.sparcs_id,
      date: message.date,
    });
    socket.broadcast.emit('chat:message', socket.user.sparcs_id, msg);
    socket.emit('chat:message', socket.user.sparcs_id, msg); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
  });

  socket.on('chat:delete', async (message: messageType, user: string) => {
    const msgIdObj = new ObjectId(message._id)
    if (message.username === '' || message.username === user || await Chat.find({'username': user})) {
      await Chat.updateOne(
        {_id: msgIdObj}, 
        { $set: { 'type': MessageEnum.DELETED } } 
      )
    }
    socket.broadcast.emit('chat:delete', message._id);
    socket.emit('chat:delete', message._id);
  });
};
