import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    const jwtSecret = req.app.get('jwt-secret')
    const token = req.headers['x-access-token'] || ''

    jwt verify(token, jwtSecret, (err, decode) => {
        if(err) {
            res.status(403).json({
                error: err.message
            })
            return
        }
        req.decoded = decode
        req.token = token
        next ()
    })
}
