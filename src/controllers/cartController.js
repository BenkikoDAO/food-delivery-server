import geolib from "geolib";
import Cart from "../models/cart.js";
import Menu from "../models/menu.js";
import Customer from "../models/customer.js";
import Vendor from "../models/vendor.js";
import logger from "../helpers/logging.js";
import redisClient from "../helpers/redisClient.js";

export async function addCartItem(req, res) {
  try {
    const { customerId, itemId, quantity, deliveryFee } = req.body;
    const cartItem = await Menu.findById(itemId);
    const customer = await Customer.findById(customerId);
    const redisKey = `cartItems:${customerId}`;

    if (!cartItem) {
      return res.status(400).json({ error: "This item does not exist on the menu" });
    }
    if (!customer) {
      return res.status(400).json({ error: "This customer does not exist" });
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
    //get customer cart and save in cache
    const customerCart = await Cart.find({ customerId })
    await redisClient.set(redisKey, JSON.stringify(customerCart));

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
    const cartItemId = req.params.id;

    const cartItem = await Cart.findById(cartItemId);
    const redisKey = `cartItems:${cartItem.customerId}`;

    if (!cartItem) {
      res.status(400).json({ error: "Cart item does not exist" });
      return; // Exit the function early if the cart item is not found
    }

    // Update the cart item data
    cartItem.description += " & " + req.body.extraNote;
    const updatedCartItem = await Cart.findByIdAndUpdate(cartItemId, req.body, {
      new: true,
    });

    const customerCart = await Cart.find({ customerId: cartItem.customerId })

    // Update the item in the Redis cache
    await redisClient.set(redisKey, JSON.stringify(customerCart));

    res.status(200).json(updatedCartItem);
  } catch (error) {
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}
export async function updateExtraNote(req, res) {
  try {
    const cartItemId = req.params.id;
    const cartItem = await Cart.findById(cartItemId);
    const redisKey = `cartItems:${cartItem.customerId}`;

    if (!cartItem) {
      return res.status(400).json({ error: "Cart item does not exist" });
    }

    cartItem.description += " & " + req.body.extraNote;
    const updatedProduct = await cartItem.save();
    logger.info("Extra note added successfully");
    //find the customer's cart and update it in the cache
    const customerCart = await Cart.find({ customerId: cartItem.customerId })
    await redisClient.set(redisKey, JSON.stringify(customerCart));

    res.status(200).json(updatedProduct);
  } catch (error) {
    logger.error("An error occured when updating cart", error);
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}
export async function getCartItems(req, res) {
  try {
    const customerId = req.params.id;
    const redisKey = `cartItems:${customerId}`;

    // Attempt to retrieve cart items from cache
    const cachedData = await redisClient.get(redisKey);

    if (cachedData) {
      // Cart items found in cache, send them as a response
      res.status(200).json(JSON.parse(cachedData));
    } else {
      // Cart items not found in cache, fetch them from the database
      const cartItems = await Cart.find({ customerId });
      // Cache the fetched cart items in Redis for future use
      await redisClient.set(redisKey, JSON.stringify(cartItems));
      res.status(200).json(cartItems);
    }
  } catch (error) {
    // logger.error("Cannot get cart items for this customer", error);
    res.status(400).json({ message: "Cart is empty" });
  }
}
export async function deleteItem(req, res) {
  try {
    const itemId = req.params.id;

    const item = await Cart.findById(itemId);
    const redisKey = `cartItems:${item.customerId}`;

    if (!item) {
      res.status(400).json("Item not found");
      return; // Exit the function early if item not found
    }
    await Cart.findByIdAndDelete(itemId);
    res.status(200).json({ message: "Item deleted" });

    const cachedCart = await redisClient.get(redisKey)
    if (cachedCart) {
      const parsedCart = JSON.parse(cachedCart);
      // Remove the deleted item from the cached cart
      const updatedCart = parsedCart.filter(item => item._id !== itemId);

      // Update the cached cart
      await redisClient.set(redisKey, JSON.stringify(updatedCart));
    }
  } catch (error) {
    console.log(error)
    res
      .status(400)
      .json({ message: "An error occurred when deleting the cart item" });
  }
}

export async function clearCart(req, res) {
  try {
    const customerId = req.params.customerId;
    const redisKey = `cartItems:${customerId}`;
    
    // Find and delete all cart items for the specified customerId
    const result = await Cart.deleteMany({ customerId: customerId });

    if (result.deletedCount === 0) {
      res.status(400).json({ message: "No cart items found for the customer" });
    } else {
      res.status(200).json({ message: "Cart items deleted" });
    }
    const customerCart = await Cart.find({ customerId })
    await redisClient.set(redisKey, JSON.stringify(customerCart));

  } catch (error) {
    logger.error("An error occurred when deleting cart items: ", error);
    res
      .status(500)
      .json({ message: "An error occurred when deleting cart items" });
  }
}

export async function calcDeliveryFee(req, res) {
  const {
    longitude,
    latitude,
    vendorNames,
    customerId,
    orderTime,
    orderDate,
    streetAddress,
    street,
  } = req.body;
  const redisKey = `cartItems:${customerId}`;

  if (
    !latitude ||
    !longitude ||
    !vendorNames ||
    !orderTime ||
    !orderDate ||
    !streetAddress ||
    !customerId ||
    !street
  ) {
    logger.error("Enter all required fields to calculate fee");
    return res.status(400).json("Enter all the required fields!");
  }
  try {
    const vendorCoordinates = {};
    const vendorDeliveryFees = {}; // Separate delivery fees for each vendor

    for (const vendorName of vendorNames) {
      const vendor = await Vendor.findOne({ name: vendorName });
      if (vendor) {
        vendorCoordinates[vendorName] = {
          latitude: vendor.latitude,
          longitude: vendor.longitude,
        };
        // console.log(vendorCoordinates);

        // Calculate distance and delivery fee
        const customerCoordinates = {
          // mapbox returns the coordinates in this order
          latitude: latitude,
          longitude: longitude,
        };

        const ratePerKilometer = 45; // Rate in shillings per kilometer

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

        // Ensure the minimum delivery fee is 22 shillings
        if (deliveryFee < 45) {
          deliveryFee = 50;
        }
        //rounds to the next multiple of 5
        const roundedDeliveryFee = Math.ceil(deliveryFee / 5) * 5;
        // Store the delivery fee for each vendor
        vendorDeliveryFees[vendorName] = parseFloat(
          roundedDeliveryFee.toFixed(0)
        );
      }
    }

    // Update cart items with delivery fees
    const cartItems = await Cart.find({ customerId: customerId });

    for (const cartItem of cartItems) {
      if (vendorDeliveryFees.hasOwnProperty(cartItem.vendorName)) {
        cartItem.deliveryFee = vendorDeliveryFees[cartItem.vendorName];
        cartItem.orderTime = orderTime;
        cartItem.orderDate = orderDate;
        cartItem.streetAddress = streetAddress;
        (cartItem.longitude = longitude),
          (cartItem.latitude = latitude),
          (cartItem.street = street);
        //update the cart item
        await cartItem.save();
        //update the item in cache
        const customerCart = await Cart.find({ customerId: cartItem.customerId })

        await redisClient.set(redisKey, JSON.stringify(customerCart));
      }
      // console.log(cartItem);
    }

    res.status(200).json({ vendorDeliveryFees });
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    res.status(500).json("An error occurred while calculating delivery fee.");
  }
}
