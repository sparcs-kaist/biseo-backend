import { Request, Response } from 'express';
import Chat, { ChatDocument } from '@/models/chat';

export const getChats = async (req: Request, res: Response): Promise<void> => {
  const sparcs_id = req.user.sparcs_id;
  const chatPerPage = 100;
  const lastChatId: string = req.params.lastChatId; // 가장 작성 시간이 이른 메세지의 id

  let lastChatDate = '9999-11-11T11:11:11.111Z';
  if (lastChatId != undefined) {
    const lastChats: any = await Chat.findOne({
      _id: lastChatId,
    }).exec();

    if (!lastChats || lastChats.length == 0) {
      console.log('DB가 비었습니다!');
      return;
    }
    lastChatDate = lastChats.date;
  }

  const chats: ChatDocument[] = await Chat.find({
    $or: [
      { date: { $lt: lastChatDate } },
      {
        $and: [{ date: { $eq: lastChatDate } }, { _id: { $gt: lastChatId } }],
      },
    ],
  })
    .sort({ date: -1, _id: 1 })
    .limit(chatPerPage)
    .lean();

  chats.map(
    chat =>
      (chat.username =
        chat.username === sparcs_id ? (chat.username = '') : chat.username)
  );

  // 최신 메세지가 배열의 머리에 있어야 함
  res.json({ chats: chats });
};
