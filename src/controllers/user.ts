import { Request, Response } from 'express';
import User, { UserDocument } from '@/models/user';
import { getOnlineVacantMembers } from '../socket/utils';
import { MemberState } from '@/common/enums';
import Vote from '@/models/vote';
import Agenda from '@/models/agenda';
import Admin from '@/models/admin';
import Chat from '@/models/chat';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const preset: number = parseInt(req.query['preset'] as string) - 1;
  if (isNaN(preset) || preset < -1 || preset > 2) {
    res.status(400);
    res.send('Preset is invalid value.');
    return;
  }
  type User = {
    uid: string;
    sparcsId: string;
    isVotable: boolean;
    state: MemberState;
  };

  const onlineMemberState: {
    uid: string;
    state: MemberState;
  }[] = await getOnlineVacantMembers();
  const userDocuments: UserDocument[] = await User.find({}).lean();
  const users: User[] = userDocuments.map(user => {
    let _state = onlineMemberState.find(e => e.uid === user.uid)?.state;
    if (_state === undefined) _state = MemberState.OFFLINE;
    return {
      uid: user.uid,
      sparcsId: user.sparcsId,
      isVotable: preset !== -1 && user.isVotable[preset],
      state: _state,
    };
  });
  res.json({ users: users });
};

export const updateUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  const preset: number = parseInt(req.query['preset'] as string) - 1;
  if (isNaN(preset) || preset < 0 || preset > 2) {
    res.status(400);
    res.send('Preset is invalid value.');
    return;
  }

  type User = { sparcsId: string; isVotable: boolean };
  const users: User[] = req.body['users'];
  if (users === undefined) {
    res.status(400);
    res.send('Request body is invalid.');
    return;
  }

  users.forEach(async user => {
    const sparcsId = user.sparcsId;
    const isVotable = user.isVotable;

    switch (preset) {
      case 0:
        await User.updateOne(
          { sparcsId: sparcsId },
          { $set: { 'isVotable.0': isVotable } }
        );
        break;
      case 1:
        await User.updateOne(
          { sparcsId: sparcsId },
          { $set: { 'isVotable.1': isVotable } }
        );
        break;
      case 2:
        await User.updateOne(
          { sparcsId: sparcsId },
          { $set: { 'isVotable.2': isVotable } }
        );
        break;
    }
    res.status(200);
    res.end('success');
  });
};

export const deleteUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  await User.deleteMany({});
  res.end('success');
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  const sparcsId = req.body['sparcsId'] as string;
  const checkExisted = await User.findOne({ sparcsId: sparcsId });
  if (checkExisted !== null) {
    res.status(400);
    res.json({ success: false });
    return;
  }

  await User.create({
    sparcsId: sparcsId,
    uid: '0',
    isVotable: [false, false, false],
  });
  res.status(200);
  res.json({
    success: true,
    user: {
      sparcsId: sparcsId,
      uid: '0',
      isVotable: [false, false, false],
      state: MemberState.OFFLINE,
    },
  });
};

export const changeName = async (
  req: Request,
  res: Response
): Promise<void> => {
  const newId = req.body['newId'] as string;
  const oldId = req.user.sparcs_id;
  const checkExisted = await User.findOne({ sparcsId: oldId });
  if (checkExisted === null) {
    res.status(400).json({ success: false });
    return;
  }

  const checkRepeated = await User.findOne({ sparcsId: newId });

  if (checkRepeated !== null) {
    res.status(200);
    res.json({ success: false });
    return;
  }

  await User.updateOne({ sparcsId: oldId }, { sparcsId: newId });
  await Chat.updateMany({ username: oldId }, { username: newId });
  await Vote.updateMany({ username: oldId }, { username: newId });
  await Admin.updateOne({ username: oldId }, { username: newId });

  const agendas = await Agenda.find({});

  agendas.forEach(async agendaDoc => {
    if (agendaDoc.participants.includes(oldId)) {
      const newParts = agendaDoc.participants.map(id =>
        id === oldId ? newId : id
      );
      await Agenda.updateOne(
        { _id: agendaDoc._id },
        { participants: newParts }
      );
    }
  });

  res.status(200).json({ success: true });
};
