import { createRider, loginRider, resetPassword, updatePassword, getRider, getRiders } from "../controllers/riderController.js";
import express from "express";
const router = express.Router()

router.route("/register").post(createRider)
router.route("/login").post(loginRider)
router.route("/reset").post(resetPassword)
router.route("/update-password").put(updatePassword)
router.route("/").get(getRiders)
router.route("/:id").get(getRider)

export default router