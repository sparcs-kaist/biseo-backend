import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { signToken } from '@/utils/jwt';
import client from '@/utils/sso';
import Admin from '@/models/admin';
import { UserInfo } from '@/common/types';

export const authCheck = (req: Request, res: Response): void => {
  const tokenHeader = req.headers['x-access-token'];
  if (typeof tokenHeader !== 'string') {
    res.status(404).json({
      error: 'Token not included in request!',
    });
    return;
  }

  const [_, token] = tokenHeader.split(' ');
  if (token === undefined) {
    res.json({ success: false });
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET as string, (err, _) => {
    if (err) res.json({ success: false });
    else res.json({ success: true });
  });
};

export const authAdminCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  const tokenHeader = req.headers['x-access-token'];
  if (typeof tokenHeader !== 'string') {
    res.status(404).json({
      error: 'Token not included in request!',
    });
    return;
  }

  const [_, token] = tokenHeader.split(' ');
  if (token === undefined) {
    res.json({ success: false });
    return;
  }

  if (process.env.TOKEN_SECRET === undefined) {
    res.status(500).json({
      error: 'Token secret not initialized!',
    });
    return;
  }

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
    async (err, decoded) => {
      if (err) res.json({ success: false });
      else {
        const isAdmin = await Admin.exists({
          username: (decoded as UserInfo).sparcs_id,
        });
        if (isAdmin) res.json({ success: true });
        else res.json({ success: false });
      }
    }
  );
};

export const login = (req: Request, res: Response): void => {
  const { url, state } = client.getLoginParams();
  req.session.state = state;
  res.json({ url });
};

export const loginCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, state } = req.query;
  const stateBefore = req.session.state;
  if (stateBefore !== state) {
    res.status(401).json({
      error: 'TOKEN MISMATCH: session might be hijacked!',
      status: 401,
    });
    return;
  }

  const user = await client.getUserInfo(code);
  // `sparcs_id` field does not exist when the account is
  // a test account, and test accounts are important
  user.sparcs_id = user.sparcs_id ?? user.uid.slice(0, 10);

  const isUserAdmin = await Admin.exists({ username: user.sparcs_id });
  const token = signToken(
    user,
    isUserAdmin,
    process.env.TOKEN_SECRET as string
  );

  const sparcsID = user.sparcs_id;
  const ssoUID = user.uid;
  const userInfo = { sparcsID, ssoUID };

  res.status(200).json({ token, user: userInfo });
};
