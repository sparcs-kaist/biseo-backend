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
import { redis } from '@/database/redis-instance';
import { MemberState } from '@/common/enums';
import User from '@/models/user';

export default (httpServer: http.Server): void => {
  const io = socket(httpServer);

  // attach auth related properties to socket
  io.use(authMiddleware);

  // main logic of listener socket
  io.on('connection', async socket => {
    const redisClient = redis.getConnection();
    const { sparcs_id, isAdmin, uid } = socket.user;

    const accessors = await redisClient.hget('accessors', sparcs_id);
    const accessCount = accessors !== null ? parseInt(accessors) : 0;
    if (accessCount === 0) {
      redisClient.hset('memberStates', sparcs_id, MemberState.ONLINE);
      socket.broadcast.emit('chat:enter', sparcs_id); // broadcast the user's entrance
    }
    redisClient.hset('accessors', sparcs_id, accessCount + 1);

    // register user in DB
    await User.create({
      sparcsId: sparcs_id,
      uid: uid,
      isVotable: [false, false, false],
    });

    const members = await getConnectedMembers();
    socket.emit('chat:members', members); // send list of members to new user

    socket.emit('chat:name', sparcs_id); // send sparcs_id to new user

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
