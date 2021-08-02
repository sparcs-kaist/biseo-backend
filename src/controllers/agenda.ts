import { Request, Response } from 'express';
import Agenda, { AgendaDocument } from '@/models/agenda';
import Vote from '@/models/vote';

export const getAgendas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const agendas: AgendaDocument[] = await Agenda.find({})
    .limit(10)
    .sort({ expires: -1 })
    .lean();

  const agendaIds = agendas.map(({ _id }) => _id);

  const votes: {
    // eslint-disable-next-line
    _id: any;
    voters: { username: string; choice: string; uid: string }[];
  }[] = await Vote.aggregate([
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
  const { sparcs_id } = req.user;
  const _id = req.params.id;

  const agenda = await Agenda.findOne({ _id }).lean();

  const userVote = await Vote.findOne({
    agenda: _id,
    username: sparcs_id,
  }).lean();

  res.json({
    ...agenda,
    userChoice: userVote?.choice ?? null,
  });
};
