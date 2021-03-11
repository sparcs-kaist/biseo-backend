import express from 'express';
import * as auth from '@/controllers/auth';

const router = express.Router();

router.get('/check', auth.authCheck);
router.post('/login', auth.login);
router.get('/login/callback', auth.loginCallback);

export default router;
