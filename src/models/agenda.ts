import { Schema, model } from 'mongoose';
import { MongoDocument } from '@/common/types';

export interface BaseAgenda {
  expires: Date;
  title: string;
  content: string;
  subtitle: string;
  choices: string[];
  votesCountMap: Map<string, number>;
}

export type AgendaDocument = MongoDocument<BaseAgenda>;

// agenda === 안건
const agendaSchema = new Schema(
  {
    expires: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    choices: {
      type: [String],
      required: true,
    },
    /**
     * 선택지와 현재까지 해당 선택지에 집계된 투표 갯수의 대응 (역정규화)
     * vote collection에 투표가 추가되면 이 필드 수정해야 함!
     * map of string -> number
     * e.g. { "찬성": 3, "반대": 5 }
     */
    votesCountMap: {
      type: Map,
      of: Number,
      required: true,
    },
  },
  {
    collection: 'agendas',
  }
);

export default model<AgendaDocument>('Agenda', agendaSchema);
