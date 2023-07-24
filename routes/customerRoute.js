import customerController from "../controllers/customerController.js";
import customerProtect from "../middleware/customerMiddleware.js";
import express from "express";
const router = express.Router()

router.route("/register").post(customerController.createCustomer)
router.route("/login").post(customerController.loginCustomer)
router.route("/reset").post(customerController.resetPassword)
router.route("/update-password").put(customerProtect, customerController.updatePassword)
router.route("/").get(customerController.getCustomers)
router.route("/:id").get(customerController.getCustomer)

export default router