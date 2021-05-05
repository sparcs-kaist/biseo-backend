import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { SSOUser } from '@/common/types';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['x-access-token'];

  if (typeof authHeader !== 'string')
    return res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });

  const [_, token] = authHeader.split(' ');
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
      res.status(403).json({
        error: error?.message,
      });
      return;
    }

    req.user = decoded as SSOUser;
    req.token = token;
    next();
  });
};
