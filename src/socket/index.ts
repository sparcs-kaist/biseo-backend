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
    if (sparcs_id in socketIds) {
      socketIds[sparcs_id].add(socket.id);
    } else {
      socketIds[sparcs_id] = new Set();
      socketIds[sparcs_id].add(socket.id);
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
    } else if (user.uid === '0') {
      await User.updateOne({ sparcsId: user.sparcsId }, { $set: { uid: uid } });
    }

    // listen for chats
    chatListener(io, socket, redisClient);

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
