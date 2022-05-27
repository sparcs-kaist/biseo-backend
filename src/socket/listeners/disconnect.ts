import { Server, Socket } from 'socket.io';
import { redis } from '@/database/redis-instance';

/*
 * disconnectListener - register 'disconnect' event to socket
 *   upon disconnection, modify the `accessors` variable and send appropriate events
 */
export const disconnectListener = (
  io: Server,
  socket: Socket,
  socketIds: { [key: string]: Set<string> },
  adminSocketIds: Set<string>
): void => {
  const { uid, sparcs_id, isAdmin } = socket.user;
  const redisClient = redis.getConnection();

  socket.on('disconnect', async () => {
    try {
      socketIds[sparcs_id].delete(socket.id);
      if (isAdmin) adminSocketIds.delete(socket.id);

      const ctUser = await redisClient.hget('accessors', uid);
      if (ctUser === null || ctUser === '0')
        // something's wrong
        return;

      await redisClient.hset('accessors', uid, String(parseInt(ctUser) - 1));

      if (parseInt(ctUser) - 1 > 0)
        // no need to broadcast. user is still here
        return;

      await redisClient.hdel('memberStates', uid); // 해당 유저를 memberStates에서 아예 삭제
      socket.broadcast.emit('chat:out', sparcs_id); // 전체 유저에게 누가 나갔는지 보내줌
    } catch (error) {
      console.error(error);
    }
  });
};
