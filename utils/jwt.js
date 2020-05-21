import jwt from 'jsonwebtoken'

export const jwtSign = (user, jwtSecret) => jwt.sign(
	{
	uid: user.uid,
	first_name: user.first_name,
	last_name: user.last_name,
	sparcs_id: user.sparcs_id,
	},
	jwtSecret,
	{
		expiresIn: '60d'
	}
)
