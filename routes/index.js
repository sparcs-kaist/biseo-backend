import express from 'express';
import * as auth from '../controllers/auth.js';
import votesRouter from './votes';
import agendasRouter from './agendas';
import { authMiddleware } from '../middlewares';

const router = express.Router();

router.get('/auth/check', auth.authCheck);
router.post('/login', auth.login);
router.get('/login/callback', auth.loginCallback);
router.use('/votes', authMiddleware, votesRouter);
router.use('/agendas', authMiddleware, agendasRouter);

export default router;
