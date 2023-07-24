import vendorController from "../controllers/vendorController.js";
import vendorProtect from "../middleware/vendorMiddleware.js";
import express from "express";
const router = express.Router()

router.route("/register").post(vendorController.createVendor)
router.route("/login").post(vendorController.loginVendor)
router.route("/reset-password").post(vendorController.resetPassword)
router.route("/update-password").put(vendorController.updatePassword)
router.route("/update-vendor/:id").put(vendorProtect, vendorController.updateVendor)
router.route("/").get(vendorController.getVendors)
router.route("/:id").get(vendorController.getVendor)
router.route("/delete/:id").delete(vendorProtect, vendorController.deleteVendor)
router.route("/addRider").post(vendorProtect, vendorController.addRider)

export default router