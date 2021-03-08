import express from 'express';
import Agenda from '../models/agenda';
import Vote from '../models/vote';

const router = express.Router();

router.get('/', async (req, res) => {
    const now = new Date();
    const agendas = await Agenda.find({
        expires: { $gt: now }
    })
        .limit(10)
        .sort({ expires: -1 })
        .lean();

    const agendaIds = agendas.map(({ _id }) => _id);

    const votes = await Vote.find({
        agendaId: { $in: agendaIds },
        username: req.decoded.sparcs_id
    });

    const agendasResponse = agendas.map(agenda => {
        const userVote = votes.find(vote => vote.agendaId.equals(agenda._id));

        return {
            ...agenda,
            userChoice: userVote?.choice ?? null
        };
    });

    res.json({ agendas: agendasResponse });
});

router.get('/:id', async (req, res) => {
    const { sparcs_id } = req.decoded;
    const _id = req.params.id;

    const agendas = await Agenda.findOne({ _id });
    const userVote = await Vote.findOne({ agenda: _id, username: sparcs_id });

    res.json({
        ...agendas,
        userChoice: userVote?.choice ?? null
    });
});

export default router;
