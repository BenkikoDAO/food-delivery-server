import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface IRider extends Document {
  name: string;
  email: string;
  image: string;
  password: string;
  phoneNumber: string;
  availability: string;
  paymail: string;
  publicKey: string;
  secretKey: string;
  address: string;
  latitude: number;
  longitude: number;
  licenseExpiry: string;
  licensePlate: string;
  id_image: string;
  orderId: ObjectId;
  order: any[];
  fcmToken: string | undefined;
  token: string;
  vendorID: ObjectId;
}
const riderSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // unique: true,
  },
  image: {
    type: String,
  },
  password: {
    type: String,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
  },
  paymail: {
    type: String,
  },
  publicKey: {
    type: String,
  },
  secretKey: {
    type: String,
  },
  address: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  licenseExpiry: {
    type: String,
  },
  licensePlate: {
    type: String,
  },
  id_image: {
    type: String,
  },
  orderId: {
    type: Schema.Types.ObjectId,
  },
  order: {
    type: Array,
  },
  fcmToken: {
    type: String,
  },
  token: {
    type: String, //Used in password reset
  },
  vendorID: {
    type: Schema.Types.ObjectId,
  },
});

export default mongoose.model<IRider>("Rider", riderSchema);
