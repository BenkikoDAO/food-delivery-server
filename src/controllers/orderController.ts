import { Request, Response } from "express";
import dotenv from "dotenv";
import { customAlphabet } from "nanoid/non-secure";
import admin from "firebase-admin";
import Order from "../models/order";
import Vendor from "../models/vendor";
import logger from "../helpers/logging";
import Cart from "../models/cart";
import Notification from "../models/notifications";
// import WebSocket from "ws";
dotenv.config();

export async function createOrder(req: Request, res: Response) {
  const { customerId, vendorNames } = req.body;
  const cart = await Cart.find({ customerId: customerId });
  if (!cart) {
    return res.status(404).json({ message: "This customer's cart is empty" });
  }
  const orders = [];
  const notifications = [];
  // Get the WebSocket server instance
  // const wss: WebSocket.Server | undefined = req.app.get("wss");
  // if (!wss) {
  //   throw new Error("WebSocket server is missing");
  // }
  const processedVendors = new Set<string>();
  for (const vendorName of vendorNames) {
    if (processedVendors.has(vendorName)) {
      continue; // Skip this vendor if already processed
    }
    const vendor = await Vendor.findOne({ name: vendorName });

    if (!vendor) {
      logger.error(`Vendor with name ${vendorName} not found`);
      continue; // Skip this vendor and move to the next one
    }
    const vendorCartItems = cart.filter(
      (item) => item.vendorName === vendorName
    );
    // Calculate the total amount for the order
    const orderTotalAmount = vendorCartItems.reduce((total, item) => {
      return total + (item.price ?? 0);
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
      totalAmount: orderTotalAmount,
    });
    await order.save();
    orders.push(order);

    logger.info(
      `Order created by ${order.customerId} to vendor - ${order.vendorName}`
    );

    const notificationMessage = `You have received a new order - Order No #${order.orderNumber} from a customer. Check the order details on the dashboard and prepare the delicious dishes for delivery.`;
    const notification = new Notification({
      vendorId: vendor._id,
      message: notificationMessage,
    });
    await notification.save();
    notifications.push(notification);
    // Find the WebSocket connection for the vendor (if exists)
    // const vendorWebSocket = Array.from(wss.clients).find(
    //   (client: WebSocket) => {
    //     return client.id === vendor._id.toString();
    //   }
    // );
    // If a WebSocket connection exists for the vendor, send the notification
    // if (vendorWebSocket) {
    //   const notificationPayload = {
    //     type: "New order",
    //     message: notificationMessage,
    //     order: order,
    //   };
    //   vendorWebSocket.send(JSON.stringify(notificationPayload));
    // }
    if (vendor.fcmToken) {
      const notificationMessage = `You have received a new order - Order No #${order.orderNumber} from a customer. Check the order details on the dashboard and prepare the delicious dishes for delivery.`;

      const message = {
        notification: {
          title: "New Order",
          body: notificationMessage,
        },
        token: vendor.fcmToken, // Vendor's FCM token
      };

      try {
        await admin.messaging().send(message);
        logger.info(`Push notification sent to ${vendor.name}`);
      } catch (error) {
        logger.error(`Error sending push notification - ${error}`);
      }

      processedVendors.add(vendorName);
    }
  }

  if (orders.length === 0) {
    res.status(404).json({ message: "No valid vendors found" });
    return;
  }
  res.status(200).json(orders);
}
export async function getOrdersByVendor(req: Request, res: Response) {
  try {
    const { vendorName } = req.query; // Use req.query to get query parameters
    const orders = await Order.find({ vendorName: vendorName });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving orders" });
    console.error("Error getting orders by vendor:", error);
  }
}

export async function orderNotification(req: Request, res: Response) {
  try {
    const vendorId = req.params.vendorId;
    const notifications = await Notification.find({ vendorId: vendorId });
    res.status(200).json(notifications);
  } catch (error) {
    res
      .status(400)
      .json({ message: "There are no notifications at this time." });
    console.error("Error getting orders by customer:", error);
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { status, riderId, riderName } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.riderId && riderId && riderId !== order.riderId) {
      return res
        .status(400)
        .json({ error: "This order is already assigned to a rider." });
    }

    //     Before updating the riderId, it checks if the order already has a riderId, and if riderId is provided in the request, it compares the new riderId with the existing one. If they are different, it returns an error indicating that the order is already assigned to a rider.
    // This change ensures that you don't accidentally change the riderId of an order that is already assigned to a rider. If the riderId is the same as the existing one or if the order doesn't have a riderId, it proceeds with the update as before.

    if (status) {
      order.status = status;
    }

    if (riderId && riderName) {
      order.riderId = riderId;
      order.riderName = riderName;
    }

    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
    // console.log(updatedOrder)
  } catch (error) {
    res
      .status(400)
      .json({ message: "Order you tried to update does not exist" });
    console.error("Error updating order status:", error);
  }
}

export async function getOrdersByCustomer(req: Request, res: Response) {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customerId });

    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ message: "You have not placed any orders" });
    console.error("Error getting orders by customer:", error);
  }
}

export async function getOrderById(req: Request, res: Response) {
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

export async function deleteOrder(req: Request, res: Response) {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await Order.findByIdAndDelete(orderId);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({ message: "The order you tried to delete does not exist" });
    console.error("Error deleting order:", error);
  }
}
export async function deleteOrders(req: Request, res: Response) {
  try {
    const vendorName = req.body.vendorName;

    // Find and delete all cart items for the specified customerId
    const result = await Order.deleteMany({ vendorName: vendorName });

    if (result.deletedCount === 0) {
      return res
        .status(400)
        .json({ message: "No orders found for this vendor" });
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
