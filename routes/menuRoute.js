import menuController from "../controllers/menuController.js";
import vendorProtect from "../middleware/vendorMiddleware.js";
import express from "express";
import multer from "multer";
const upload = multer({ dest: 'uploads/'})
const router = express.Router()

router.route("/:id").get(menuController.getMenuItem)
router.route("/vendor/:vendorId").get(menuController.getMenuItemByVendor)
router.route("/").get(menuController.getMenuItems)
router.route("/delete/:id").delete(vendorProtect, menuController.deleteMenuItem)
router.route("/create").post(vendorProtect, upload.single('image'), menuController.addMenuItem)
router.route("/update/:id").put(vendorProtect, upload.single('image'), menuController.updateMenuItem)

export default router