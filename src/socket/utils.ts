import { MemberState } from '@/common/enums';
import { redis } from '@/database/redis-instance';

/*
 * getConnectedMembers - get member names that are currently connected to the server socket.
 *  this function returns an array of strings
 */
export const getConnectedMembers = async (): Promise<string[]> => {
  const redisClient = redis.getConnection();
  try {
    const keys: string[] = await redisClient.hkeys('accessors');

    const asyncFilter = async (
      arr: string[],
      predicate: (key: string) => Promise<boolean>
    ) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const ctUser = await redisClient.hget('accessors', key);
      return ctUser !== null && parseInt(ctUser) > 0;
    });

    return ans;
  } catch (err) {
    console.error(err);
    return [];
  }
};

/*
 * getOnlineMembers - get online member names that are currently connected to the server socket and online.
 *  this function returns an array of strings
 */
export const getOnlineMembers = async (): Promise<string[]> => {
  const redisClient = redis.getConnection();
  try {
    const keys: string[] = await redisClient.hkeys('accessors');

    const asyncFilter = async (
      arr: string[],
      predicate: (key: string) => Promise<boolean>
    ) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const ctUser = await redisClient.hget('accessors', key);
      const stUser = await redisClient.hget('memberStates', key);
      return (
        ctUser !== null && parseInt(ctUser) > 0 && stUser === MemberState.ONLINE
      );
    });

    return ans;
  } catch (err) {
    console.error(err);
    return [];
  }
};
