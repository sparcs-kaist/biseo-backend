import { Socket } from 'socket.io';
import { getUserInformation } from '@/socket/utils';

/*
 * authMiddleware - attach user and auth related properties to socket.request
 *   this middleware adds `socket.request.username` and `socket.request.isAdmin` properties
 *   `socket.request.username` is the nickname used specifically for chatting. if the user has
 *   logged in, this would be the user's SPARCS id. otherwise, it will be a random nickname.
 *   `socket.request.isAdmin` is a boolean value describing if this user is the administrator or not.
 */
export const authMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  const { username, isAdmin } = getUserInformation(
    socket.handshake.query['token']
  );

  socket.request.username = username;
  socket.request.isAdmin = isAdmin;

  next();
};
