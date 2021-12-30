import express from 'express';
import * as chat from '@/controllers/chat';

const router = express.Router();

router.get('/:lastChatId', chat.getChats);
router.get('/', chat.getChats);

export default router;
