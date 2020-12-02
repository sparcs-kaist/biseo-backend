import express from 'express';
import Vote from '../models/vote';

const router = express.Router();

// GET /api/votes
router.get('/', async (req, res) => {
    const votes = await Vote.find({})
        .sort({ expires: -1 })
        .catch(err => console.error(err));

    res.json({ votes });
});

// PUT /api/votes/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { choice } = req.body;
    const { sparcs_id } = req.decoded;

    if (!choice) return res.json({ success: false });

    const submission = {
        username: sparcs_id,
        choice
    };

    const result = await Vote.updateOne(
        { _id: id },
        { $push: { submissions: submission } }
    ).catch(error => {
        res.json({
            success: false,
            error
        });
    });

    if (result)
        res.json({
            success: true
        });
});

export default router;
