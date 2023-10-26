// @ts-nocheck

import orderController from "../controllers/orderController";
import vendorProtect from "../middleware/vendorMiddleware";
import customerProtect from "../middleware/customerMiddleware";
import express from "express";
const router = express.Router();

router.route("/create").post(customerProtect, orderController.createOrder);
router.route("/vendor/orders").get(orderController.getOrdersByVendor);
router.route("/customer/:customerId").get(orderController.getOrdersByCustomer);
router.route("/notifications/:vendorId").get(orderController.orderNotification);
router.route("/order/:id").get(orderController.getOrderById);
router.route("/update/:id").put(orderController.updateOrderStatus);
router.route("/delete/:id").delete(orderController.deleteOrder);
router.route("/delete-orders/all").delete(orderController.deleteOrders);

export default router;
