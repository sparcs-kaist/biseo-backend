import { Schema, model, Document } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseVote {
  agendaId: Document['_id'];
  uid: string;
  choice: string;
}

export type VoteDocument = MongoDocument<BaseVote>;

const voteSchema = new Schema(
  {
    agendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Agenda',
    },
    uid: {
      type: String,
      required: true,
    },
    choice: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'votes',
  }
);

export default model<VoteDocument>('Vote', voteSchema);
