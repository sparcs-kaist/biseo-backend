import jwt from 'jsonwebtoken';
import { SSOUser, TokenPayload } from '@/common/types';

const SECRET = process.env.TOKEN_SECRET as string;

export const signToken = (user: SSOUser, isAdmin: boolean): string =>
  jwt.sign(
    {
      uid: user.uid,
      sparcs_id: user.sparcs_id,
      isAdmin,
    },
    SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'sparcs-biseo',
    }
  );

export const signSameToken = (payload: TokenPayload): string =>
  jwt.sign(
    {
      uid: payload.uid,
      sparcs_id: payload.sparcs_id,
      isAdmin: payload.isAdmin,
    },
    SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'sparcs-biseo',
    }
  );

export const signRefreshToken = (): string => {
  return jwt.sign({}, SECRET, {
    algorithm: 'HS256',
    expiresIn: '14d',
    issuer: 'sparcs-biseo',
  });
};
