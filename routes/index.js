import express from 'express'
import * as auth from '../controllers/auth.js'

const router = express.Router()

router.get('/auth/check', auth.authCheck)
router.post('/login', auth.login)
router.get('/login/callback', auth.loginCallback)

export default router
