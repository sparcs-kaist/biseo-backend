import jwt from 'jsonwebtoken'
import { jwtSign } from '../utils/jwt.js'
import client from '../utils/sso.js'

const authCheck = (req, res) => {
	const jwtSecret = req.app.get('jwt-secret')
	const token = req.headers['x-access-token'] || ''

	jwt.verify(token, jwtSecret, (err, decode) => {
		if (err) {
			res.status(403).json({
				error: err.message
			});
			return;
		}
		res.status(200).json(decode)
	})
}

const login = (req, res) => {
	const {url, state} = client.getLoginParams()
	req.session.state = state
	res.json({
		url: url
	})
}

const loginCallback = async (req, res) => {
	const {code, state} = req.query
	const stateBefore = req.session.state
	if (stateBefore !== state){
		res.status(401).json({
			error: 'TOKEN MISMATCH: session might be hijacked!',
			status: 401,
		})
		return
	}
	
	const user = await client.getUserInfo(code)
	const token = jwtSign(user, req.app.get('jwt-secret'))
	res.status(200).json({
		token: token,
		status: 200,
	})
}

module.exports = {
	authCheck: authCheck,
	login: login,
	loginCallback: loginCallback
}
