import mongoose from "mongoose";
const menuItemSchema = mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  });

const orderSchema = mongoose.Schema({
    vendorID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    customerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true 
    },
    vendorName: {
        type: String,
        required: true
    },
    deliveryFee: {
        type: Number,
        required: true
    },
    deliveryAddress: {
        type: {
            type: String,
            enum: ['Point'], // Specify the type as "Point"
            required: true
          },
          coordinates: {
            type: [Number], // Array of [longitude, latitude] values
            required: true
          }
    },
    deliveryStatus:{
        type: String,
        required: true
    },
    menuItems: [menuItemSchema]
})
export default mongoose.model("Order", orderSchema)