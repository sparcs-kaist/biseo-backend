import mongoose, { Schema } from 'mongoose';

const voteSchema = Schema(
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

export default mongoose.model('Vote', voteSchema);
