import menuController from "../controllers/menuController.js";
import express from "express";
import multer from "multer";
const upload = multer({ dest: 'uploads/'})
const router = express.Router()

router.route("/:id").get(menuController.getMenuItem)
router.route("/").get(menuController.getMenuItems)
router.route("/delete/:id").delete(menuController.deleteMenuItem)
router.route("/create").post(upload.single('image'), menuController.addMenuItem)
router.route("/update/:id").put(upload.single('image'), menuController.updateMenuItem)

export default router