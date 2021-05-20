import express from 'express';
import * as member from '@/controllers/member';

const router = express.Router();

router.post('/turn-state', member.turnState);
router.get('/online-members', member.getOnlineMembers);
router.get('/offline-members', member.getOfflineMembers);
export default router;
