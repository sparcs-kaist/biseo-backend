import express from 'express'

import auth from '../controllers/auth.js'

const router = express.Router()

router.get('/auth/check', auth.authCheck)
router.post('/login', auth.login)
router.get('/login/callback', auth.loginCallback)

module.exports = router

