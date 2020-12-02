import jwt from 'jsonwebtoken';
import { jwtSign } from '../utils/jwt.js';
import client from '../utils/sso.js';
import Admin from '../models/admin.js';

export const authCheck = (req, res) => {
    const jwtSecret = req.app.get('jwt-secret');
    const token = req.headers['x-access-token'] || '';

    if (!token) return res.json({ success: false });

    jwt.verify(token.split(' ')[1], jwtSecret, (err, _) => {
        if (err) {
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
};

export const login = (req, res) => {
    const { url, state } = client.getLoginParams();
    req.session.state = state;
    res.json({ url });
};

export const loginCallback = async (req, res) => {
    const { code, state } = req.query;
    const stateBefore = req.session.state;
    if (stateBefore !== state) {
        res.status(401).json({
            error: 'TOKEN MISMATCH: session might be hijacked!',
            status: 401
        });
        return;
    }

    const user = await client.getUserInfo(code);
    const isUserAdmin = await Admin.exists({ username: user.sparcs_id });
    const token = jwtSign(user, isUserAdmin, req.app.get('jwt-secret'));

    res.status(200).json({
        token,
        status: 200
    });
};
