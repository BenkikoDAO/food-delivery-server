import mongoose from "mongoose";
const vendorSchema = new mongoose.Schema(
  {
    paymail: {
      type: String
    },
    publicKey: {
      type: String
    },
    secretKey: {
      type: String
    },
    password: {
      type: String
    },
    name: {
      type: String,
      unique: true
    },
    businessLogo: {
      type: String
    },
    cuisine: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    rating: {
      type: Number,
      default: 0
    },
    benkikoToken:{
      type: String
    },
    specialties:{
      type:Array
    },
    latitude:{
      type: Number
    },
    longitude:{
      type: Number
    },
    locationName: {
      type: String
    },
    fcmToken:{
      type: String
    },
    businessRegNo: {
      type: String,
    },
    HealthCertNo: {
      type: String
    },
    riders: [
      {
        riderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Rider",
        },
        name: String,
        phoneNumber: String,
        availability: String,
        email: String,
        image: String,
        paymail: String,
        secretKey: String,
        publicKey: String
      },
    ],
  }
);

export default mongoose.model("Vendor", vendorSchema);
