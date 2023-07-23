import geolib from "geolib";
import Order from "../models/order.js";
import Vendor from "../models/vendor.js";
import Customer from "../models/customer.js"

export async function createOrder(req, res) {
  try {
    const { vendorID, customerID, deliveryAddress, menuItems, deliveryStatus } = req.body;

    const vendor = await Vendor.findById(vendorID);
    const customer = await Customer.findById(customerID);


    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    const vendorName = vendor.name;

    // Calculate the distance between the vendor and the delivery address
    const vendorCoordinates = vendor.location.coordinates;
    const customerCoordinates = deliveryAddress.coordinates;

    const distance = geolib.getDistance(
      { latitude: vendorCoordinates[1], longitude: vendorCoordinates[0] },
      { latitude: customerCoordinates[1], longitude: customerCoordinates[0] }
    );
    // console.log(distance);
    // Calculate the delivery fee based on the distance and rate
    const ratePerKilometer = 60; // Rate in shillings per kilometer
    let deliveryFee = (distance / 1000) * ratePerKilometer;

    //If the distance is below 1km set the fee to 60KES
    if (deliveryFee < 60) {
      deliveryFee = 60;
    }

    // Create the order
    const order = new Order({
      vendorID: vendorID,
      customerID: customerID,
      customerName: customer.username,
      customerContact: customer.phoneNumber,
      deliveryAddress,
      deliveryFee,
      vendorName,
      deliveryStatus,
      menuItems
    });

    // Save the order to the database
    const savedOrder = await order.save();

    res.status(201).json({
      order: savedOrder,
      message: "Order sent successfully",
    });
  } catch (error) {
    res.status(400).json({ message: "Vendor not found" });
    console.log("Error creating order:", error);
  }
}

export async function updateOrderStatus(req, res) {
    try {
      const orderId = req.params.id;
      const { status } = req.body;
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      order.deliveryStatus = status;
      const updatedOrder = await order.save();
  
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(400).json({ message: 'Order you tries to update does not exist' });
      console.error('Error updating order status:', error);
    }
  }
  

export async function getOrdersByVendor(req, res) {
    try {
      const vendorId = req.params.vendorId;
      const orders = await Order.find({ vendorID: vendorId });
  
      res.status(200).json(orders);
    } catch (error) {
      res.status(404).json({ message: 'There are no orders to this vendor' });
      console.error('Error getting orders by vendor:', error);
    }
  }

  export async function getOrdersByCustomer(req, res) {
    try {
      const customerId = req.params.customerId;
      const orders = await Order.find({ customerID: customerId });
  
      res.status(200).json(orders);
    } catch (error) {
      res.status(400).json({ error: 'You have not placed any orders' });
      console.error('Error getting orders by customer:', error);
    }
  }

  export async function getOrderById(req, res) {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      res.status(200).json(order);
    } catch (error) {
      res.status(404).json({ message: 'Order not found' });
      console.error('Error getting order by ID:', error);
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
      res.status(400).json({ error: "The order you tried to delete does not exist" });
      console.error("Error deleting order:", error);
    }
  }


export default { createOrder, getOrderById, getOrdersByCustomer, getOrdersByVendor, updateOrderStatus, deleteOrder };
