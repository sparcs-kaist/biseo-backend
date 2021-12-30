import { Request, Response } from 'express';
import User, { UserDocument } from '@/models/user';
import { getOnlineMembers } from '../socket/utils';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const preset: number = parseInt(req.params.preset) - 1;
  if (preset < 0 || preset > 2) {
    res.status(401);
    res.send('Preset is invalid value.');
    return;
  }
  type User = { sparcsId: string; isVotable: boolean; isOnline: boolean };

  const onlineMembers: string[] = await getOnlineMembers();
  const userDocuments: UserDocument[] = await User.find({}).lean();
  const users: User[] = userDocuments.map(e => {
    return {
      sparcsId: e.sparcsId,
      isVotable: e.isVotable[preset],
      isOnline: e.sparcsId in onlineMembers,
    };
  });
  res.json({ users: users });
};
