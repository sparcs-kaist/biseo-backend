import { Document } from 'mongoose';

export type MongoDocument<T> = T & Document;

export interface SSOUser {
  uid: string;
  sid: string;
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  birthday: string;
  flags: string[];
  facebook_id: unknown;
  twitter_id: unknown;
  kaist_id: unknown;
  kaist_info: string;
  kaist_info_time: string;
  sparcs_id: string;
  ku_kname: string;
}

export type TokenPayload = Pick<SSOUser, 'uid' | 'sparcs_id' | 'ku_kname'> & {
  isAdmin: boolean;
};

export type UserInfo = TokenPayload;

export interface SuccessStatusResponse {
  success: boolean;
  payload?: any;
  message?: string;
}
