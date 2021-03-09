import { Schema, model, Document } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseVote {
  agendaId: Pick<Document, '_id'>;
  username: string;
  choice: string;
}

const voteSchema = new Schema(
  {
    agendaId: {
      type: Schema.Types.ObjectId,
      ref: 'Agenda',
    },
    username: {
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

export default model<MongoDocument<BaseVote>>('Vote', voteSchema);
