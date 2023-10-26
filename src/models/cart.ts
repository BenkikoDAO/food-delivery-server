import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface ICart extends Document {
  customer: string;
  customerId: ObjectId;
  customerContact: string;
  customerEmail: string;
  itemId: ObjectId;
  vendorName: string;
  vendorContact: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
  extras: any[];
  vendorExtras: any[];
  deliveryAddress: {
    type: string; // Should be "Point"
    coordinates: [number, number]; // Array of [longitude, latitude]
  };
  streetAddress: string;
  street: string;
  latitude: number;
  longitude: number;
  orderDate: string;
  orderTime: string;
  deliveryFee: number;
  vendorNames: string[];
}
const cartSchema: Schema = new Schema(
  {
    customer: {
      type: String,
    },
    customerId: {
      type: Schema.Types.ObjectId,
    },
    customerContact: {
      type: String,
    },
    customerEmail: {
      type: String,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      // required: true
    },
    vendorName: {
      type: String,
    },
    vendorContact: {
      type: String,
    },
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
    },
    image: {
      type: String,
    },
    extras: {
      type: Array,
    },
    vendorExtras: {
      type: Array,
    },
    deliveryAddress: {
      type: {
        type: String,
        enum: ["Point"], // Specify the type as "Point"
        // required: true
      },
      coordinates: {
        type: [Number], // Array of [longitude, latitude] values
        // required: true
      },
    },
    streetAddress: {
      type: String,
    },
    street: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    orderDate: {
      type: String,
    },
    orderTime: {
      type: String,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    vendorNames: {
      type: Array,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICart>("eatsCart", cartSchema);
