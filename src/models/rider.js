import mongoose from "mongoose";
const riderSchema = new mongoose.Schema({

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
    type: String
  },
  password: {
    type: String
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  availability: {
    type: String
  },
  paymail: {
    type: String
  },
  publicKey: {
    type: String
  },
  secretKey: {
    type: String
  },
  address:{
    type:String
  },
  latitude:{
    type: Number
  },
  longitude: {
    type: Number
  },
  licenseExpiry:{
    type: String
  },
  licensePlate:{
    type: String
  },
  id_image:{
    type: String
  },
  orderId:{
    type: mongoose.Schema.Types.ObjectId,
  },
  order:{
    type:Array
  }
});

export default mongoose.model("Rider", riderSchema);
