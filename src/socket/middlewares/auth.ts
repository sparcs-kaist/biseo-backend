import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { TokenPayload } from '@/common/types';

/*
 * authMiddleware - attach user and auth related properties to socket.request
 *   this middleware adds a `socket.request.user` property that contains the
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

    // sparcs_id is null for SSO test accounts.
    // in that case, assign a portion of uid to username
    userInfo.sparcs_id = userInfo.sparcs_id ?? userInfo.uid.slice(0, 10);

    socket.user = userInfo;
    next();
  } catch (err) {
    throw new Error('Invalid Token: error while verifying token');
  }
};
