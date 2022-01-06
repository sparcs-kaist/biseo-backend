import { Schema, model } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseUser {
  sparcsId: string;
  uid: string;
  isVotable: boolean[];
}

export type UserDocument = MongoDocument<BaseUser>;

const userSchema = new Schema(
  {
    sparcsId: {
      type: String,
      required: true,
    },
    uid: {
      type: String,
      required: true,
    },
    isVotable: {
      type: [Boolean],
      required: true,
    },
  },
  {
    collection: 'users',
  }
);

export default model<UserDocument>('User', userSchema);
