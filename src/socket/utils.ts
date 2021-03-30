import jwt from 'jsonwebtoken';
import { TokenPayload } from '@/common/types';

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

    return { username: sparcs_id, uid, isAdmin };
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
export const getConnectedMembers = (
  accessors: Record<string, number>
): string[] => Object.keys(accessors).filter(user => accessors[user] > 0);
