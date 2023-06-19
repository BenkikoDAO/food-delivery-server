import { createCustomer, loginCustomer, resetPassword, updatePassword } from "../controllers/customerController.js";
import express from "express";
const router = express.Router()

router.route("/register").post(createCustomer)
router.route("/login").post(loginCustomer)
router.route("/reset").post(resetPassword)
router.route("/update-password").put(updatePassword)

export default router