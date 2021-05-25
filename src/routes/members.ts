import express from 'express';
import * as member from '@/controllers/member';

const router = express.Router();

router.post('/toggle', member.toggleState);
router.get('/online', member.getOnlineMembers);
router.get('/offline', member.getOfflineMembers);

export default router;
