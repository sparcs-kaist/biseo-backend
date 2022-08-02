import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { TokenPayload } from '@/common/types';

/*
 * authMiddleware - attach user and auth related properties to socket
 *   this middleware adds a `socket.user` property that contains the
 *   whole token payload (see `TokenPayload` type in common/types)
 */
export const authMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  try {
    const userInfo = jwt.verify(
      socket.handshake.query['token'],
      process.env.TOKEN_SECRET as string
    ) as TokenPayload;

    socket.user = userInfo;
    next();
  } catch (err) {
    const error = new Error('authentication_error');
    next(error);
  }
};
