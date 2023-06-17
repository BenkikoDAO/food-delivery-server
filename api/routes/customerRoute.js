import { createCustomer, loginCustomer } from "../controllers/customerController.js";
import express from "express";
const router = express.Router()

router.route("/register").post(createCustomer)
router.route("/login").post(loginCustomer)

export default router