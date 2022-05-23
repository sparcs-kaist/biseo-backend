import express from 'express';
import authRouter from './auth';
import agendasRouter from './agendas';
import membersRouter from './members';
import chatRouter from './chat';
import usersRouter from './user';
import { adminMiddleware, authMiddleware } from '@/middlewares';

const router = express.Router();

router.use('/auth', authRouter);

router.use('/agendas', authMiddleware, agendasRouter);
router.use('/members', authMiddleware, membersRouter);
router.use('/chat', authMiddleware, chatRouter);
router.use('/users', authMiddleware, usersRouter);

router.use('/admin/agendas', authMiddleware, adminMiddleware, agendasRouter);

export default router;
