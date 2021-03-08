import express from 'express';
import * as agenda from '../controllers/agenda';

const router = express.Router();

router.get('/', agenda.getAgendas);
router.get('/:id', agenda.getAgenda);

export default router;
