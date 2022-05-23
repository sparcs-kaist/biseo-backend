import { RequestHandler } from 'express';
import Admin from '../models/admin';

export const adminMiddleware: RequestHandler = async (req, res, next) => {
  const admin = await Admin.findOne({ username: req.user.sparcs_id });
  if (!admin)
    return res
      .status(403)
      .send({ error: { status: 403, message: 'Access denied.' } });
  next();
};
