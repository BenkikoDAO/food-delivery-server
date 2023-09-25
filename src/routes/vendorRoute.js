import vendorController from "../controllers/vendorController.js";
import vendorProtect from "../middleware/vendorMiddleware.js";
import multer from "multer";
import express from "express";
const upload = multer({ dest: "uploads/" });
const router = express.Router();

router
  .route("/register")
  .post(upload.single("businessLogo"), vendorController.createVendor);
router.route("/login").post(vendorController.loginVendor);
router
  .route("/reset-password-request")
  .post(vendorController.requestResetPassword);
router.route("/reset-password").post(vendorController.changePassword);
router
  .route("/update-vendor/:id")
  .put(
    // vendorProtect,
    upload.single("businessLogo"),
    vendorController.updateVendor
  );
router
  .route("/update/editRider/:id/:riderId")
  .put(
    upload.fields([{ name: "image" }, { name: "id_image" }]),
    vendorController.editRider
  );
router.route("/").get(vendorController.getVendors);
router.route("/:id").get(vendorController.getVendor);
router
  .route("/delete/:id")
  .delete(vendorProtect, vendorController.deleteVendor);
router
  .route("/addRider/:id")
  .post(upload.single("image"), vendorController.addRider);
router
  .route("/deleteRider/:vendorId/:riderId")
  .delete(vendorController.deleteRider);

export default router;
