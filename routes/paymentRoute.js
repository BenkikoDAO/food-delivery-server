import express from 'express'
const router = express.Router()

import { handleCallback, getCallbackResponse, getPayoutResponse } from '../controllers/paymentController.js'

router.route("/callback").post(handleCallback)
router.route("/response").post(getCallbackResponse)
router.route("/payout-response").post(getPayoutResponse)

export default router