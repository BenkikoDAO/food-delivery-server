import orderController from "../controllers/orderController.js";
import vendorProtect from "../middleware/vendorMiddleware.js";
import customerProtect from "../middleware/customerMiddleware.js";
import express from "express"
const router = express.Router()

router.route("/create").post( customerProtect, orderController.createOrder)
router.route("/vendor/orders").get(orderController.getOrdersByVendor)
router.route("/customer/:customerId").get(orderController.getOrdersByCustomer)
router.route("/order/:id").get(orderController.getOrderById)
router.route("/update/:id").put(orderController.updateOrderStatus)
router.route("/delete/:id").delete(orderController.deleteOrder)
router.route("/delete-orders/all").delete(orderController.deleteOrders)

export default router