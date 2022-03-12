import http from 'http';
import socket from 'socket.io';
import {
  adminListener,
  chatListener,
  disconnectListener,
  voteListener,
} from './listeners';
import { authMiddleware } from './middlewares';
import { redis } from '@/database/redis-instance';
import { MemberState } from '@/common/enums';
import User, { UserDocument } from '@/models/user';
import { vacantListener } from './listeners/vacant';

export default (httpServer: http.Server): void => {
  const io = socket(httpServer);
  const socketIds: { [key: string]: Set<string> } = {};
  const adminSocketIds: Set<string> = new Set();

  // attach auth related properties to socket
  io.use(authMiddleware);

  // main logic of listener socket
  io.on('connection', async socket => {
    const { uid, sparcs_id, isAdmin } = socket.user;
    if (uid in socketIds) {
      socketIds[uid].add(socket.id);
    } else {
      socketIds[uid] = new Set();
      socketIds[uid].add(socket.id);
    }

    if (isAdmin) {
      adminSocketIds.add(socket.id);
    }

    const redisClient = redis.getConnection();
    const accessors = await redisClient.hget('accessors', uid);
    const accessCount = accessors !== null ? parseInt(accessors) : 0;
    if (accessCount === 0) {
      redisClient.hset('memberStates', uid, MemberState.ONLINE);
      socket.broadcast.emit('chat:enter', sparcs_id); // broadcast the user's entrance
    }
    redisClient.hset('accessors', uid, accessCount + 1);

    // register user in DB
    const user: UserDocument | null = await User.findOne({
      sparcsId: sparcs_id,
    });
    if (user === null) {
      await User.create({
        sparcsId: sparcs_id,
        uid: uid,
        isVotable: [false, false, false],
      });
    }

    // listen for chats
    chatListener(io, socket);

    // listen for votes
    voteListener(io, socket);

    // listen to disconnect event
    disconnectListener(io, socket, socketIds, adminSocketIds);

    // listen to vacant event
    vacantListener(io, socket);

    // only attach admin listener to admins
    if (isAdmin) adminListener(io, socket, socketIds, adminSocketIds);
  });
};
