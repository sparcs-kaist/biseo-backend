import { Schema, model } from 'mongoose';
import { MongoDocument } from '@/common/types';
import { AgendaStatus } from '@/common/enums';

export interface BaseAgenda {
  title: string;
  content: string;
  subtitle: string;
  status: AgendaStatus;
  createDate: Date;
  expires: Date;
  choices: string[];
  votesCountMap: Map<string, string[]>;
  participants: string[];
}

interface AgendaExtended extends BaseAgenda, Document {
  checkStatus: () => AgendaStatus;
}

export type AgendaDocument = MongoDocument<AgendaExtended>;

// agenda === 안건
const agendaSchema = new Schema(
  {
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
    status: {
      type: String,
      enum: [AgendaStatus.PREPARE, AgendaStatus.PROGRESS],
      default: AgendaStatus.PREPARE,
      required: true,
    },
    createDate: {
      type: Date,
      required: true,
    },
    expires: {
      type: Date,
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
      of: [String],
      required: true,
    },
    participants: {
      type: [String], // array of sparcs_id
      required: true,
    },
  },
  {
    collection: 'agendas',
  }
);

agendaSchema.methods.checkStatus = function () {
  const status = this.status;
  const isExpired = Date.now() > Date.parse(this.expires.toISOString());
  if (isExpired) {
    return AgendaStatus.TERMINATE;
  }
  return status;
};

export const checkStatus = function (agenda: AgendaDocument) {
  const status = agenda.status;
  const isExpired = Date.now() > Date.parse(agenda.expires.toISOString());
  if (isExpired) {
    return AgendaStatus.TERMINATE;
  }
  return status;
};

export default model<AgendaDocument>('Agenda', agendaSchema);
