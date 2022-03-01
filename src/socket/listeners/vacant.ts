import { Server, Socket } from 'socket.io';
import { redis } from '@/database/redis-instance';
import { MemberState } from '@/common/enums';

/*
 * vacantListener - register 'vacant' event to socket
 *   upon vacant, modify the `accessors` variable and send appropriate events
 */
export const vacantListener = (io: Server, socket: Socket): void => {
  const { uid, sparcs_id } = socket.user;
  const redisClient = redis.getConnection();

  socket.on('vacant:on', async () => {
    try {
      const ctUser = await redisClient.hget('accessors', uid);
      if (ctUser === null || ctUser === '0')
        // something's wrong
        return;
      redisClient.hset('memberStates', uid, MemberState.VACANT);
      socket.broadcast.emit('vacant:on', sparcs_id); // broadcast the user's vacant:on
    } catch (error) {
      console.error(error);
    }
  });
  socket.on('vacant:off', async () => {
    try {
      const ctUser = await redisClient.hget('accessors', uid);
      if (ctUser === null || ctUser === '0')
        // something's wrong
        return;
      redisClient.hset('memberStates', uid, MemberState.ONLINE);
      socket.broadcast.emit('vacant:off', sparcs_id); // broadcast the user's vacant:off
    } catch (error) {
      console.error(error);
    }
  });
};
