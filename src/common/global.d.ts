import { SSOUser } from './types';

declare module 'express-serve-static-core' {
  interface Request {
    user: SSOUser;
    token: string;
  }
}

declare module 'express-session' {
  interface SessionData {
    state: string;
  }
}
