import express from 'express'
const router = express.Router()

import { handleCallback, getCallbackResponse } from '../controllers/paymentController.js'

router.route("/callback").post(handleCallback)
router.route("/response").post(getCallbackResponse)

export default router