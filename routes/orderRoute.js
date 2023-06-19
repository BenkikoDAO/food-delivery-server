import orderController from "../controllers/orderController.js";
import express from "express"
const router = express.Router()

router.route("/create").post(orderController.createOrder)
router.route("/vendor/:vendorId").get(orderController.getOrdersByVendor)
router.route("/customer/:customerId").get(orderController.getOrdersByCustomer)
router.route("/order/:id").get(orderController.getOrderById)
router.route("/update/:id").put(orderController.updateOrderStatus)
router.route("/delete/:id").delete(orderController.deleteOrder)

export default router