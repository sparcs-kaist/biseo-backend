import { Request, Response } from 'express';
import Agenda, { AgendaDocument, checkStatus } from '@/models/agenda';
import Vote from '@/models/vote';
import { AgendaStatus } from '@/common/enums';

export const getAgendas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { isAdmin } = req.user;

  const agendas: AgendaDocument[] = await Agenda.find({})
    .sort({ expires: -1 })
    .lean();

  const filteredAgendas = isAdmin
    ? agendas
    : agendas.filter(agenda => {
        agenda !== null && checkStatus(agenda) !== AgendaStatus.PREPARE;
      });

  const agendaIds = filteredAgendas.map(({ _id }) => _id);

  type Voter = { username: string; choice: string; uid: string };
  // eslint-disable-next-line
  type VoteAggregate = { _id: any; voters: Voter[] };

  const votes: VoteAggregate[] = await Vote.aggregate([
    { $match: { agendaId: { $in: agendaIds } } },
    {
      $group: {
        _id: '$agendaId',
        voters: {
          $addToSet: { username: '$username', uid: '$uid', choice: '$choice' },
        },
      },
    },
  ]);

  const agendasResponse = agendas.map(agenda => {
    const voteInfo = votes.find(({ _id }) => _id.equals(agenda._id)) ?? {
      _id: '',
      voters: [],
    };

    const { participants } = agenda;
    const voterNames = voteInfo.voters.map(({ username }) => username);

    const pplWhoDidNotVote = participants.filter(
      name => !voterNames.includes(name)
    );
    const voteInfoOfThisUser = voteInfo.voters.find(
      ({ uid }) => uid === req.user.uid
    );
    const choiceOfThisUser = voteInfoOfThisUser?.choice ?? null;

    return {
      ...agenda,
      participants,
      pplWhoDidNotVote,
      userChoice: choiceOfThisUser,
    };
  });

  res.json({ agendas: agendasResponse });
};

export const getAgenda = async (req: Request, res: Response): Promise<void> => {
  const { sparcs_id, isAdmin } = req.user;
  const _id = req.params.id;

  const agenda = await Agenda.findOne({ _id }).lean();

  if (!isAdmin && checkStatus(agenda) == AgendaStatus.PREPARE) {
    res.json({});
  }

  const userVote = await Vote.findOne({
    agenda: _id,
    username: sparcs_id,
  }).lean();

  res.json({
    ...agenda,
    userChoice: userVote?.choice ?? null,
  });
};
