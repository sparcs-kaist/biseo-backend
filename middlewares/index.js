import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    if (!req.headers['x-access-token'])
        res.status(403).json({
            error: 'Unauthorized. Please log in!'
        });

    const token = req.headers['x-access-token'].split(' ')[1] || '';

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({
                error: err.message
            });
            return;
        }

        req.decoded = decoded;
        req.token = token;
        next();
    });
};
