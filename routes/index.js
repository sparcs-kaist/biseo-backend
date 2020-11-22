import express from 'express';
import * as auth from '../controllers/auth.js';
import Vote from '../models/vote';

const router = express.Router();

router.get('/auth/check', auth.authCheck);
router.post('/login', auth.login);
router.get('/login/callback', auth.loginCallback);

router.get('/votes', async (req, res) => {
    const votes = await Vote.find({})
        .sort({ expires: -1 })
        .catch(err => console.error(err));

    res.json({ votes });
});

export default router;
