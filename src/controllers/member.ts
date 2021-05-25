import { Request, Response } from 'express';
import { redis } from '../database/redis_instance';

export const turnState = async (req: Request, res: Response): Promise<void> => {
  const redisClient = redis.getConnection();
  const sparcs_id = req.user.sparcs_id;

  const state = await redisClient.hget('memberStates', sparcs_id);
  if (state === null) {
    res.status(404).json({
      error: 'invalid sparcs_id',
    });
    return;
  }
  const newState = state === 'online' ? 'offline' : 'online';
  await redisClient.hset('memberStates', sparcs_id, newState);

  res.json({ sparcs_id: sparcs_id, state: newState });
};

export const getOnlineMembers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const redisClient = redis.getConnection();
  try {
    const keys: string[] = await redisClient.hkeys('memberStates');

    const asyncFilter = async (arr: string[], predicate: any) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const state: string = await redisClient.hget('memberStates', key);
      return state === 'online';
    });

    res.json({ members: ans });
  } catch (error) {
    res.status(500).json({
      error: error?.message,
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
    const keys: string[] = await redisClient.hkeys('memberStates');

    const asyncFilter = async (arr: string[], predicate: any) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const state: string = await redisClient.hget('memberStates', key);
      return state === 'offline';
    });

    res.json({ members: ans });
  } catch (error) {
    res.status(500).json({
      error: error?.message,
    });
    res.json({ error: error });
  }
};
