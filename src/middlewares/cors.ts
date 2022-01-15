import { RequestHandler } from 'express';

// cors middleware for development
export const corsMiddleware: RequestHandler = (req, res, next) => {
  res.set('Access-Control-Allow-Origin', req.get('origin'));
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', [
    'POST',
    'GET',
    'OPTIONS',
    'PATCH',
    'DELETE',
  ]);
  res.set('Access-Control-Allow-Headers', 'x-access-token');

  if (req.method === 'OPTIONS') res.sendStatus(200);
  else next();
};
