import { Request, Response } from 'express';
import Agenda, { AgendaDocument } from '@/models/agenda';
import Vote, { VoteDocument } from '@/models/vote';

export const getAgendas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const agendas: AgendaDocument[] = await Agenda.find({})
    .limit(10)
    .sort({ expires: -1 })
    .lean();

  const agendaIds = agendas.map(({ _id }) => _id);

  const votes: VoteDocument[] = await Vote.find({
    agendaId: { $in: agendaIds },
    username: req.decoded.sparcs_id,
  });

  const agendasResponse = agendas.map(agenda => {
    const userVote = votes.find(vote => vote.agendaId.equals(agenda._id));

    return {
      ...agenda,
      userChoice: userVote?.choice ?? null,
    };
  });

  res.json({ agendas: agendasResponse });
};

export const getAgenda = async (req: Request, res: Response): Promise<void> => {
  const { sparcs_id } = req.decoded;
  const _id = req.params.id;

  const agendas = await Agenda.findOne({ _id }).lean();
  const userVote = await Vote.findOne({
    agenda: _id,
    username: sparcs_id,
  }).lean();

  res.json({
    ...agendas,
    userChoice: userVote?.choice ?? null,
  });
};
