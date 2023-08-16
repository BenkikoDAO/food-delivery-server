import Cart from "../models/cart.js";
import Menu from "../models/menu.js";
import Customer from "../models/customer.js";

export async function addCartItem(req, res) {
  try {
    const { customerId, itemId, quantity } = req.body;
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
      return res.status(400).json({ error: "This item is already in the cart" });
    }

      const item = new Cart({
        itemId: itemId,
        vendorName: cartItem.vendorName,
        vendorContact: cartItem.vendorContact,
        customer: customer.username,
        customerId: customerId,
        name: cartItem.name,
        description: cartItem.description,
        price: cartItem.price,
        quantity: quantity,
        image: cartItem.image,
      }); //save the item
      const savedItem = await item.save();

      res.status(201).json(savedItem);
    
  } catch (error) {
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

    cartItem.description += ' & ' + req.body.extraNote;
    const updatedProduct = await Cart.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}

export async function updateExtraNote(req, res) {
  try {
    const cartItem = await Cart.findById(req.params.id);
    if (!cartItem) {
      return res.status(400).json({ error: "Cart item does not exist" });
    }

    // Concatenate the extraNote to the existing description
    cartItem.description += ' & ' + req.body.extraNote;

    // Update other fields if needed
    // cartItem.someOtherField = req.body.someOtherField;

    // Save the updated cartItem
    const updatedProduct = await cartItem.save();

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: "An error occurred when updating cart" });
  }
}


export async function getCartItems(req, res) {
  try {
    const customerId = req.params.id;
    const cartItems = await Cart.find({ customerId: customerId });

    res.status(200).json(cartItems);
  } catch (error) {
    res.status(400).json({ message: "Cart is empty" });
    console.error("Error getting orders by customer:", error);
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
    res
      .status(400)
      .json({ message: "An error occurred when deleting the cart item" });
    console.error("Error deleting cart item:", error);
  }
}
