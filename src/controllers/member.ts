import { Request, Response } from 'express';
import { MemberState } from '@/common/enums';
import { redis } from '@/database/redis-instance';
import { getErrorMessage } from '@/utils/error';

export const toggleState = async (
  req: Request,
  res: Response
): Promise<void> => {
  const redisClient = redis.getConnection();
  const { uid, sparcs_id } = req.user;

  const state = await redisClient.hget('memberStates', uid);
  if (state === null) {
    res.status(404).json({
      error: 'invalid uid',
    });
    return;
  }
  const newState =
    state === MemberState.ONLINE ? MemberState.OFFLINE : MemberState.ONLINE;
  await redisClient.hset('memberStates', uid, newState);

  res.json({ uid: uid, sparcs_id: sparcs_id, state: newState });
};

export const getOnlineMembers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const redisClient = redis.getConnection();
  try {
    const keys: string[] = await redisClient.hkeys('memberStates');

    const asyncFilter = async (
      arr: string[],
      predicate: (key: string) => Promise<boolean>
    ) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const state = await redisClient.hget('memberStates', key);
      return state === MemberState.ONLINE;
    });

    res.json({ members: ans });
  } catch (error) {
    res.status(500).json({
      error: getErrorMessage(error),
    });
    res.json({ error: error });
  }
};

export const getOfflineMembers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const redisClient = redis.getConnection();

  try {
    const keys = await redisClient.hkeys('memberStates');

    const asyncFilter = async (
      arr: string[],
      predicate: (key: string) => Promise<boolean>
    ) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const state = await redisClient.hget('memberStates', key);
      return state === MemberState.OFFLINE;
    });

    res.json({ members: ans });
  } catch (error) {
    res.status(500).json({
      error: getErrorMessage(error),
    });
    res.json({ error: error });
  }
};
