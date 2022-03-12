import { Server, Socket } from 'socket.io';
import Chat from '@/models/chat';
import User from '@/models/user';
import { getOnlineVacantMembers } from '@/socket/utils';
import { MemberState } from '@/common/enums';

/*
 * chat - register 'chat:message' event to socket
 */

export enum MessageEnum {
  NEW = 'new',
  MEMBERS = 'members',
  MESSAGE = 'message',
  OUT = 'out',
}

type messageType = {
  type: MessageEnum;
  message: string;
  date: string;
};

export const chatListener = (io: Server, socket: Socket): void => {
  /* send list of members to new user */
  socket.on('chat:members', async () => {
    const onlineMemberState: {
      uid: string;
      state: MemberState;
    }[] = await getOnlineVacantMembers();
    const _chatMemberState = await Promise.all(
      onlineMemberState.map(async ms => {
        const user = await User.findOne({ uid: ms.uid });
        if (user === null) {
          return { sparcsId: ms.uid, state: MemberState.ONLINE };
        } else {
          return { sparcsId: user.sparcsId, state: ms.state };
        }
      })
    );
    socket.emit('chat:members', _chatMemberState);
  });

  socket.on('chat:message', async (message: messageType) => {
    await Chat.create({
      type: MessageEnum.MESSAGE,
      message: message.message,
      username: socket.user.sparcs_id,
      date: message.date,
    });
    socket.broadcast.emit('chat:message', socket.user.sparcs_id, message); // 유저가 chat message 로 메시지를 socket에게 보냄 -> 전체에게 메시지 뿌려줌
  });
};
