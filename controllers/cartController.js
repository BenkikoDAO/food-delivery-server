import geolib from "geolib";
import Cart from "../models/cart.js";
import Menu from "../models/menu.js";
import Customer from "../models/customer.js";
import Vendor from "../models/vendor.js";
import logger from "../helpers/logging.js";

export async function addCartItem(req, res) {
  try {
    const { customerId, itemId, quantity, deliveryFee } = req.body;
    const cartItem = await Menu.findById(itemId);
    const customer = await Customer.findById(customerId);

    if (!cartItem) {
      res.status(400).json({ error: "This item does not exist on the menu" });
    }
    if (!customer) {
      res.status(400).json({ error: "This customer does not exist" });
    }

    const existingCartItem = await Cart.findOne({
      customerId: customerId,
      itemId: itemId, // Here we are checking for the same itemId in the cart
    });

    if (existingCartItem) {
      return res
        .status(400)
        .json({ error: "This item is already in the cart" });
    }

    const item = new Cart({
      itemId: itemId,
      vendorName: cartItem.vendorName,
      vendorContact: cartItem.vendorContact,
      customer: customer.username,
      customerContact: customer.phoneNumber,
      customerEmail: customer.email,
      customerId: customerId,
      name: cartItem.name,
      description: cartItem.description,
      price: cartItem.price,
      quantity: quantity,
      deliveryFee: deliveryFee,
      image: cartItem.image,
    }); //save the item
    const savedItem = await item.save();

    res.status(201).json(savedItem);
    logger.info(`Cart item added by: ${savedItem.customer}`);
  } catch (error) {
    logger.error("An error occured when adding item to cart", error);
    res
      .status(400)
      .json({ message: "An error occured when adding item to cart" });
    console.log("Error adding item to cart:", error);
  }
}
export async function updateCart(req, res) {
  try {
    const cartItem = await Cart.findById(req.params.id);
    if (!cartItem) {
      res.status(400).json({ error: "Cart item does not exist" });
    }

    cartItem.description += " & " + req.body.extraNote;
    const updatedProduct = await Cart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error("An error occured when updating cart", error);
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}
export async function updateExtraNote(req, res) {
  try {
    const cartItem = await Cart.findById(req.params.id);
    if (!cartItem) {
      return res.status(400).json({ error: "Cart item does not exist" });
    }

    cartItem.description += " & " + req.body.extraNote;
    const updatedProduct = await cartItem.save();
    logger.info("Extra note added successfully");

    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error("An error occured when updating cart", error);
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}
export async function getCartItems(req, res) {
  try {
    const customerId = req.params.id;
    const cartItems = await Cart.find({ customerId: customerId });

    res.status(200).json(cartItems);
  } catch (error) {
    logger.error("Cannot get cart items for this customer", error);
    res.status(400).json({ message: "Cart is empty" });
  }
}
export async function deleteItem(req, res) {
  try {
    const itemId = req.params.id;
    const item = await Cart.findById(itemId);
    if (!item) {
      res.status(400).json("Item not found");
    }
    await Cart.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    logger.error("An error occurred when deleting the cart item: ", error);
    res
      .status(400)
      .json({ message: "An error occurred when deleting the cart item" });
  }
}

export async function calcDeliveryFee(req, res) {
  const { deliveryAddress, vendorNames, customerId, deliveryTime, deliveryDate, streetAddress } = req.body;
  if (!deliveryAddress || !vendorNames || !deliveryTime || ! deliveryDate || ! streetAddress || !customerId) {
    logger.error('Enter all required fields to calculate fee')
    return res.status(400).json('Enter all the required fields!');
  }
  try {
    const vendorCoordinates = {};
    const vendorDeliveryFees = {}; // Separate delivery fees for each vendor

    for (const vendorName of vendorNames) {
      const vendor = await Vendor.findOne({ name: vendorName });
      if (vendor) {
        vendorCoordinates[vendorName] = {
          latitude: vendor.location.coordinates[0],
          longitude: vendor.location.coordinates[1],
        };
        // console.log(vendorCoordinates);

        // Calculate distance and delivery fee
        const customerCoordinates = {
          // mapbox returns the coordinates in this order
          latitude: deliveryAddress.coordinates[1],
          longitude: deliveryAddress.coordinates[0],
        };

        const ratePerKilometer = 60; // Rate in shillings per kilometer

        const vendorCoord = vendorCoordinates[vendorName];
        const distanceInMeters = geolib.getDistance(
          {
            latitude: customerCoordinates.latitude,
            longitude: customerCoordinates.longitude,
          },
          { latitude: vendorCoord.latitude, longitude: vendorCoord.longitude }
        );
        // console.log(distanceInMeters);
        const distanceInKilometers = distanceInMeters / 1000;
        let deliveryFee = distanceInKilometers * ratePerKilometer;

        // Ensure the minimum delivery fee is 60 shillings
        if (deliveryFee < 60) {
          deliveryFee = 60;
        }
        const roundedDeliveryFee = Math.round(deliveryFee / 5) * 5;
        // Store the delivery fee for each vendor
        vendorDeliveryFees[vendorName] = parseFloat(roundedDeliveryFee.toFixed(0));
      }
    }

    // Update cart items with delivery fees
    const cartItems = await Cart.find({ customerId: customerId });
    
    for (const cartItem of cartItems) {
      if (vendorDeliveryFees.hasOwnProperty(cartItem.vendorName)) {
        cartItem.deliveryFee = vendorDeliveryFees[cartItem.vendorName];
        cartItem.deliveryTime = deliveryTime;
        cartItem.deliveryDate = deliveryDate;
        cartItem.streetAddress = streetAddress;
        cartItem.deliveryAddress = deliveryAddress
        await cartItem.save();
      }
      // console.log(cartItem);
    }

    res.status(200).json({ vendorDeliveryFees });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    res.status(500).json('An error occurred while calculating delivery fee.');
  }
}
