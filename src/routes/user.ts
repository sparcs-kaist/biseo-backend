import express from 'express';
import * as user from '@/controllers/user';

const router = express.Router();

router.get('/', user.getUsers);
router.patch('/', user.updateUsers);
router.delete('/', user.deleteUsers);
router.post('/', user.addUser);

export default router;
