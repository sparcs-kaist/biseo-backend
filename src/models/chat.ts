import { Schema, model, Document } from 'mongoose';
import { MongoDocument } from '@/common/types';

export enum MessageEnum {
  NEW = 'new',
  MEMBERS = 'members',
  MESSAGE = 'message',
  OUT = 'out',
  VOTESTART = 'votestart',
  VOTEEND = 'voteend',
}

export interface BaseChat {
  type: MessageEnum;
  message: string;
  username: string;
  date: string;
}

export type ChatDocument = MongoDocument<BaseChat>;

const chatSchema = new Schema(
  {
    type: {
      type: MessageEnum,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'chats',
  }
);

export default model<ChatDocument>('Chat', chatSchema);
