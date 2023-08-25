import express from 'express'
const router = express.Router()

import { handleCallback } from '../controllers/paymentController.js'

router.route("/callback").post(handleCallback)

export default router