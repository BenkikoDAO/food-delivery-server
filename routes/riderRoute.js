import { createRider, loginRider, updateRider, deleteRider, changePassword, requestResetPassword, getRider, getRiders, getRidersByVendor } from "../controllers/riderController.js";
import express from "express";
import multer from "multer";
const upload = multer({ dest: 'uploads/'})
const router = express.Router()

router.route("/register").post(upload.single('image'), createRider)
router.route("/login").post(loginRider)
router.route("/update/:id").put(upload.fields([{ name: "image" }, { name: "id_image" }]),updateRider)
router.route("/reset-password-request").post(requestResetPassword)
router.route('/reset-password').post(changePassword)
router.route("/").get(getRiders)
router.route("/riders/:vendorId").get(getRidersByVendor)
router.route("/delete/:id").delete(deleteRider)
router.route("/:id").get(getRider)

export default router