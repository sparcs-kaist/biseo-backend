import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { signRefreshToken, signSameToken, signToken } from '@/utils/jwt';
import client from '@/utils/sso';
import Admin from '@/models/admin';
import User, { UserDocument } from '@/models/user';
import { TokenPayload, UserInfo } from '@/common/types';
import { redis } from '@/database/redis-instance';

export const authCheck = (req: Request, res: Response): void => {
  const accessTokenHeader = req.headers['x-access-token'];
  const refreshTokenHeader = req.headers['x-refresh-token'];

  if (
    typeof accessTokenHeader !== 'string' ||
    typeof refreshTokenHeader !== 'string'
  ) {
    res.status(404).json({
      error: 'Token not included in request!',
    });
    return;
  }

  const [_, accessToken] = accessTokenHeader.split(' ');
  const refreshToken = refreshTokenHeader.split(' ')[1];
  if (accessToken === undefined || refreshToken === undefined) {
    res.json({ success: false });
    return;
  }

  jwt.verify(
    accessToken,
    process.env.TOKEN_SECRET as string,
    async (err, _) => {
      if (err) {
        try {
          // 1. Check Refresh Token Valid
          jwt.verify(refreshToken, process.env.TOKEN_SECRET as string);

          // 2. Get Payload from Access Token
          const accessTokenPayload = jwt.verify(
            accessToken,
            process.env.TOKEN_SECRET as string,
            { ignoreExpiration: true }
          ) as TokenPayload;

          // 3. Compare refreshToken with refreshToken in redis
          const redisClient = redis.getConnection();
          const refreshTokenInRedis = await redisClient.hget(
            'refreshTokens',
            accessTokenPayload.sparcs_id
          );

          // If refreshToken is valid, send new access Token
          if (refreshToken === refreshTokenInRedis) {
            const newAccessToken = signSameToken(accessTokenPayload);
            res.json({ success: true, token: newAccessToken });
            return;
          } else {
            res.json({ success: false });
            return;
          }
        } catch (err) {
          res.json({ success: false });
          return;
        }
      } else res.json({ success: true });
    }
  );
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
    res.status(403).json({
      error: 'TOKEN MISMATCH: session might be hijacked!',
      status: 403,
    });
    return;
  }

  const user = await client.getUserInfo(code);
  // `sparcs_id` field does not exist when the account is
  // a test account, and test accounts are important
  if (!user.sparcs_id) {
    res
      .status(200)
      .json({ token: null, refreshToken: null, user: null, isSparcs: false });
    return;
  }

  user.sparcs_id = user.sparcs_id ?? user.uid.slice(0, 10);

  // register user in DB
  const userInDB: UserDocument = await User.findOne({
    uid: user.uid,
  }).lean();
  if (userInDB === null) {
    const preCreatedUser = await User.findOne({
      sparcsId: user.sparcs_id,
      uid: '0',
    }).lean();

    if (preCreatedUser) {
      await User.updateOne(
        { sparcsId: user.sparcsId },
        { $set: { uid: user.uid } }
      );
    } else {
      await User.create({
        sparcsId: user.sparcs_id,
        uid: user.uid,
        isVotable: [false, false, false],
      });
    }
  }

  // 닉네임 변경 시 변경한 닉네임으로 적용
  if (userInDB.sparcsId !== user.sparcs_id) {
    user.sparcs_id = userInDB.sparcsId;
  }

  const isUserAdmin = await Admin.exists({ username: user.sparcs_id });
  const token = signToken(user, isUserAdmin);
  const refreshToken = signRefreshToken();
  const redisClient = redis.getConnection();
  redisClient.hset('refreshTokens', user.sparcs_id, refreshToken);

  const userInfo = { sparcsID: user.sparcs_id };

  res.status(200).json({ token, refreshToken, user: userInfo, isSparcs: true });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const accessTokenHeader = req.headers['x-access-token'];
  const refreshTokenHeader = req.headers['x-refresh-token'];

  if (
    typeof accessTokenHeader !== 'string' ||
    typeof refreshTokenHeader !== 'string'
  ) {
    res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });
    return;
  }
  const accessToken = accessTokenHeader.split(' ')[1];
  const refreshToken = refreshTokenHeader.split(' ')[1];
  if (accessToken === undefined || refreshToken === undefined) {
    res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });
    return;
  }

  try {
    // 1. Check Refresh Token Valid
    jwt.verify(refreshToken, process.env.TOKEN_SECRET as string);

    // 2. Get Payload from Access Token
    const accessTokenPayload = jwt.verify(
      accessToken,
      process.env.TOKEN_SECRET as string,
      { ignoreExpiration: true }
    ) as TokenPayload;

    // 3. Compare refreshToken with refreshToken in redis
    const redisClient = redis.getConnection();
    const refreshTokenInRedis = await redisClient.hget(
      'refreshTokens',
      accessTokenPayload.sparcs_id
    );

    // If refreshToken is valid, send new access Token
    if (refreshToken === refreshTokenInRedis) {
      const newAccessToken = signSameToken(accessTokenPayload);
      res.status(201).json({ token: newAccessToken });
      return;
    } else {
      res.status(403).json({
        error: 'Unauthorized. Please log in!',
      });
      return;
    }
  } catch (err) {
    res.status(403).json({
      error: 'Unauthorized. Please log in!',
    });
    return;
  }
};
