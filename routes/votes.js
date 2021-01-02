import express from 'express';
import Vote from '../models/vote';

const router = express.Router();

// GET /api/votes
router.get('/', async (req, res) => {
    const { sparcs_id } = req.decoded;

    const votes = await Vote.aggregate([
        {
            $sort: {
                expires: -1
            }
        },
        {
            $addFields: {
                userVoteStatus: {
                    $reduce: {
                        input: '$submissions',
                        initialValue: { hasAlreadyVoted: false, choice: null },
                        in: {
                            $cond: {
                                if: {
                                    $or: [
                                        '$$value.hasAlreadyVoted',
                                        { $ne: ['$$this.username', sparcs_id] }
                                    ]
                                },
                                then: '$$value',
                                else: {
                                    hasAlreadyVoted: true,
                                    choice: '$$this.choice'
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $project: {
                hasAlreadyVoted: '$userVoteStatus.hasAlreadyVoted',
                userChoice: '$userVoteStatus.choice',
                choices: 1,
                title: 1,
                content: 1,
                subtitle: 1,
                expires: 1
            }
        }
    ]).catch(err => console.error(err));

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
        // do not update if this user has already voted
        { _id: id, 'submissions.username': { $ne: sparcs_id } },
        { $push: { submissions: submission } }
    ).catch(error => {
        res.json({
            success: false,
            error
        });
    });

    if (result) res.json({ success: true });
    else res.json({ success: false });
});

export default router;
