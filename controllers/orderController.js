import dotenv from "dotenv";
import { customAlphabet } from "nanoid";
import admin from "firebase-admin";
import Order from "../models/order.js";
import Vendor from "../models/vendor.js";
import logger from "../helpers/logging.js";
import Cart from "../models/cart.js";
import Notification from "../models/notifications.js";
import Customer from "../models/customer.js";
dotenv.config();
// const fcmServiceAccountJson = process.env.FCM_SERVICE_ACCOUNT;
// Parse the JSON string to a JSON object
// const serviceAccount = process.env.FCM_SERVICE_ACCOUNT;
// admin.initializeApp({
//   credential: admin.credential.cert(JSON.parse(serviceAccount)),
// });

export async function createOrder(req, res) {
  const { customerId, vendorNames } = req.body;
  const cart = await Cart.find({ customerId: customerId });
  if (!cart) {
    res.status(404).json({ message: "This customer's cart is empty" });
    return;
  }
  const orders = [];
  const notifications = [];
  // Get the WebSocket server instance
  const wss = req.app.get("wss");
  for (const vendorName of vendorNames) {
    const vendor = await Vendor.findOne({ name: vendorName });

    if (!vendor) {
      logger.error(`Vendor with name ${vendorName} not found`);
      continue; // Skip this vendor and move to the next one
    }
    const vendorCartItems = cart.filter((item) => item.vendorName === vendorName);
    // Calculate the total amount for the order
    const orderTotalAmount = vendorCartItems.reduce((total, item) => {
      return total + item.price + item.deliveryFee;
    }, 0);
    const alphabet =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateNanoid = customAlphabet(alphabet, 6); // Generates IDs of length 6
    const orderNumber = generateNanoid();

    const order = new Order({
      orderNumber: orderNumber,
      customerId: customerId,
      customerCart: vendorCartItems,
      vendorName: vendor.name, // Associate the vendor's name with the order
      status: "Pending",
      totalAmount: orderTotalAmount
    });
    await order.save();
    orders.push(order);

    const notificationMessage = `You have received a new order - Order No #${order.orderNumber} from a customer. Check the order details on the dashboard and prepare the delicious dishes for delivery.`;
    const notification = new Notification({
      vendorId: vendor._id,
      message: notificationMessage,
    });
    await notification.save();
    notifications.push(notification);
    // Find the WebSocket connection for the vendor (if exists)
    const vendorWebSocket = Array.from(wss.clients).find((client) => {
      return client.vendorId === vendor._id.toString();
    });
    // If a WebSocket connection exists for the vendor, send the notification
    if (vendorWebSocket) {
      const notificationPayload = {
        type: "New order",
        message: notificationMessage,
        order: order,
      };
      vendorWebSocket.send(JSON.stringify(notificationPayload));
    }
  }

  if (orders.length === 0) {
    res.status(404).json({ message: "No valid vendors found" });
    return;
  }
  res.status(200).json(orders);
}

export async function getOrdersByVendor(req, res) {
  try {
    const { vendorName } = req.query; // Use req.query to get query parameters
    const orders = await Order.find({ vendorName: vendorName });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving orders" });
    console.error("Error getting orders by vendor:", error);
  }
}

export async function orderNotification(req, res) {
  try {
    const vendorId = req.params.vendorId;
    const notifications = await Notification.find({vendorId: vendorId})
    res.status(200).json(notifications);
  } catch (error) {
    res.status(400).json({ message: "There are no notifications at this time." });
    console.error("Error getting orders by customer:", error);
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Order you tried to update does not exist" });
    console.error("Error updating order status:", error);
  }
}

export async function getOrdersByCustomer(req, res) {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customerID: customerId });

    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ message: "You have not placed any orders" });
    console.error("Error getting orders by customer:", error);
  }
}

export async function getOrderById(req, res) {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(404).json({ message: "Order not found" });
    console.error("Error getting order by ID:", error);
  }
}

export async function deleteOrder(req, res) {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await Order.findByIdAndDelete(orderId);

    return res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "The order you tried to delete does not exist" });
    console.error("Error deleting order:", error);
  }
}
export async function deleteOrders(req, res) {
  try {
    const vendorName = req.body.vendorName;

    // Find and delete all cart items for the specified customerId
    const result = await Order.deleteMany({vendorName: vendorName});

    if (result.deletedCount === 0) {
      res.status(400).json({ message: "No orders found for this vendor" });
    } else {
      res.status(200).json({ message: "Orders deleted" });
    }
  } catch (error) {
    logger.error("An error occurred when deleting orders: ", error);
    res.status(500).json({ message: "An error occurred when deleting orders" });
  }
}

export default {
  createOrder,
  getOrderById,
  getOrdersByCustomer,
  getOrdersByVendor,
  updateOrderStatus,
  orderNotification,
  deleteOrder,
  deleteOrders,
};
