import { Schema, model } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseAdmin {
  username: string;
}

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

export default model<MongoDocument<BaseAdmin>>('Admin', adminSchema);
