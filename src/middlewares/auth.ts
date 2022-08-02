import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UserInfo } from '@/common/types';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const accessTokenHeader = req.headers['x-access-token'];

  if (typeof accessTokenHeader !== 'string')
    return res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });

  const [_, token] = accessTokenHeader.split(' ');
  if (token === undefined)
    return res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });

  if (process.env.TOKEN_SECRET === undefined)
    return res.status(500).json({
      error: 'Token secret not initialized!',
    });

  jwt.verify(token, process.env.TOKEN_SECRET, (error, decoded) => {
    if (error !== null || decoded === undefined) {
      res.status(401).json({
        error: error?.message,
      });
      return;
    }

    req.user = decoded as UserInfo;
    req.token = token;
    next();
  });
};
