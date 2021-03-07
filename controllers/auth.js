import jwt from 'jsonwebtoken';
import { jwtSign } from '../utils/jwt.js';
import client from '../utils/sso.js';
import Admin from '../models/admin.js';

export const authCheck = (req, res) => {
    const { JWT_SECRET } = process.env;
    const tokenHeader = req.headers['x-access-token'] || '';
    const [_, token] = tokenHeader.split(' ');

    if (token === undefined) return res.json({ success: false });

    jwt.verify(token, JWT_SECRET, (err, _) => {
        if (err) res.json({ success: false });
        else res.json({ success: true });
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
    const token = jwtSign(user, isUserAdmin, process.env.JWT_SECRET);

    res.status(200).json({
        token,
        status: 200
    });
};
