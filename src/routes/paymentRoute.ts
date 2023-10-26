// @ts-nocheck

import express from "express";
const router = express.Router();

import {
  handleCallback,
  getCallbackResponse,
  getRiderPayouts,
  getPayoutResponse,
  getPayouts,
} from "../controllers/paymentController";

router.route("/callback").post(handleCallback);
router.route("/response").post(getCallbackResponse);
router.route("/payout-response").post(getPayoutResponse);
router.route("/rider/:id").get(getRiderPayouts);
router.route("/:id").get(getPayouts);

export default router;
