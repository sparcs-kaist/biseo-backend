import { Request, Response } from 'express';
import User, { UserDocument } from '@/models/user';
import { getOnlineVacantMembers } from '../socket/utils';
import { MemberState } from '@/common/enums';

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

  type User = { uid: string; isVotable: boolean };
  const users: User[] = req.body['users'];
  if (users === undefined) {
    res.status(400);
    res.send('Request body is invalid.');
    return;
  }

  users.forEach(async user => {
    const uid = user.uid;
    const isVotable = user.isVotable;

    switch (preset) {
      case 0:
        await User.updateOne(
          { uid: uid },
          { $set: { 'isVotable.0': isVotable } }
        );
        break;
      case 1:
        await User.updateOne(
          { uid: uid },
          { $set: { 'isVotable.1': isVotable } }
        );
        break;
      case 2:
        await User.updateOne(
          { uid: uid },
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
