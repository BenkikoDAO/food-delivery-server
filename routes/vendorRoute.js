import vendorController from "../controllers/vendorController.js";
import express from "express";
const router = express.Router()

router.route("/register").post(vendorController.createVendor)
router.route("/login").post(vendorController.loginVendor)
router.route("/reset-password").post(vendorController.resetPassword)
router.route("/update-password").put(vendorController.updatePassword)
router.route("/").get(vendorController.getVendors)
router.route("/:id").get(vendorController.getVendor)
router.route("/delete/:id").delete(vendorController.deleteVendor)
router.route("/addRider").post(vendorController.addRider)

export default router