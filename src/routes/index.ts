import express from 'express';
import authRouter from './auth';
import agendasRouter from './agendas';
import { authMiddleware } from '@/middlewares';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/agendas', authMiddleware, agendasRouter);

export default router;
