import jwt from 'jsonwebtoken';
import { TokenPayload } from '@/common/types';
import { redis } from '../database/redis_instance';

const randomNames = [
  'Jack',
  'Lukas',
  'James',
  'Oliver',
  'Sophia',
  'Emma',
  'Aria',
  'Amelia',
];

interface UserInfo {
  username: string;
  uid: string;
  isAdmin: boolean;
}

/*
 * getUserInformation - extract user information from JWT(JSON Web Token)
 *  this function returns an object that has two keys:
 *  {
 *      username: user's nickname for chat. either SPARCS nickname or random
 *      uid: uid(unique identification number) of user
 *      isAdmin: boolean value indicating whether this user is admin
 *  }
 */
export const getUserInformation = (token: string): UserInfo => {
  try {
    const { sparcs_id, uid, isAdmin } = jwt.verify(
      token,
      process.env.TOKEN_SECRET as string
    ) as TokenPayload;

    // sparcs_id is null for SSO test accounts.
    // in that case, assign a portion of uid to username
    const username = sparcs_id ?? uid.slice(0, 10);

    return { username, uid, isAdmin };
  } catch (err) {
    return {
      username: randomNames[Math.floor(Math.random() * randomNames.length)],
      uid: 'mock-uid',
      isAdmin: false,
    };
  }
};

/*
 * getConnectedMembers - get member names that are currently connected to the server socket.
 *  this function returns an array of strings
 */
export const getConnectedMembers = async (): Promise<string[]> => {
  const redisClient = redis.getConnection();
  try {
    const keys: string[] = await redisClient.hkeys('accessors');

    const asyncFilter = async (arr: string[], predicate: any) =>
      Promise.all(arr.map(predicate)).then(results =>
        arr.filter((_v, index) => results[index])
      );

    const ans: string[] = await asyncFilter(keys, async (key: string) => {
      const ctUser: number = await redisClient.hget('accessors', key);
      return ctUser > 0;
    });

    return ans;
  } catch (err) {
    console.log(err);
    return [];
  }
};
