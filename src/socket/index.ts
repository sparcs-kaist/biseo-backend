import http from 'http';
import socket from 'socket.io';
import {
  adminListener,
  chatListener,
  disconnectListener,
  voteListener,
} from './listeners';
import { authMiddleware } from './middlewares';
import { getConnectedMembers } from './utils';
import { redis } from '../database/redis_instance';
export default (httpServer: http.Server): void => {
  const io = socket(httpServer);

  // attach auth related properties to socket
  io.use(authMiddleware);

  // main logic of listener socket
  io.on('connection', socket => {
    const { username, isAdmin } = socket.request;

    const redisClient = redis.getConnection();
    (async () => {
      try {
        const ctUser: string = await redisClient.hget('accessors', username);
        if (ctUser == null || ctUser == '0') {
          redisClient.hset('accessors', username, '1');
        } else {
          redisClient.hset('accessors', username, String(parseInt(ctUser) + 1));
        }
        const members = await getConnectedMembers();
        socket.emit('chat:members', members); // send list of members to new user
      } catch (error) {
        console.log(error);
      }
    })();

    socket.emit('chat:name', username); // send username to new user

    // listen for chats
    chatListener(io, socket);

    // listen for votes
    voteListener(io, socket);

    // listen to disconnect event
    disconnectListener(io, socket);

    // only attach admin listener to admins
    if (isAdmin) adminListener(io, socket);
  });
};
