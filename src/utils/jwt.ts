import jwt from 'jsonwebtoken';
import { SSOUser } from '@/common/types';

export const jwtSign = (
  user: SSOUser,
  isAdmin: boolean,
  jwtSecret: string
): string =>
  jwt.sign(
    {
      uid: user.uid,
      first_name: user.first_name,
      last_name: user.last_name,
      sparcs_id: user.sparcs_id,
      isAdmin,
    },
    jwtSecret,
    {
      expiresIn: '60d',
    }
  );
