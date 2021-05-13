import { Server, Socket } from 'socket.io';
import { getConnectedMembers } from '@/socket/utils';
import { redis } from '../../database/redis_instance';

/*
 * disconnectListener - register 'disconnect' event to socket
 *   upon disconnection, modify the `accessors` variable and send appropriate events
 */
export const disconnectListener = (io: Server, socket: Socket): void => {
  const { username } = socket.request;
  const redisClient = redis.getConnection();

  socket.on('disconnect', async () => {
    try {
      const ctUser: string = await redisClient.hget('accessors', username);
      if (ctUser == null || ctUser == '0')
        // something's wrong
        return;

      await redisClient.hset(
        'accessors',
        username,
        String(parseInt(ctUser) - 1)
      );

      if (parseInt(ctUser) - 1 > 0)
        // no need to broadcast. user is still here
        return;

      const members = await getConnectedMembers();
      socket.broadcast.emit('chat:members', members); // 접속자가 변경되었으므로 전체 유저에게 변경된 접속자를 보내줌
      socket.broadcast.emit('chat:out', username); // 전체 유저에게 누가 나갔는지 보내줌
    } catch (error) {
      console.log(error);
    }
  });
};
