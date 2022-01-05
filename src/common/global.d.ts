import { SSOUser, UserInfo } from '@/common/types';

declare module 'socket.io' {
  interface Socket {
    user: UserInfo;
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    user: UserInfo;
    token: string;
  }
}

declare module 'express-session' {
  interface SessionData {
    state: string;
  }
}
