import { Schema, model } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseAdmin {
  username: string;
}

export type AdminDocument = MongoDocument<BaseAdmin>;

const adminSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'admins',
  }
);

export default model<AdminDocument>('Admin', adminSchema);
