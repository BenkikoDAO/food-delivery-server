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
    phoneNumber: {
      type: String
    },
    rating: {
      type: Number
    },
    location: {
      type: {
        type: String,
        enum: ["Point"], // Specify the type as "Point"
      },
      coordinates: {
        type: [Number], // Array of [longitude, latitude] values
      },
    },
    openingHours: {
      type: String,
    },
    closingHours: {
      type: String,
    },
    businessRegistration: {
      data: Buffer,
      contentType: String,
    },
    riders: [
      {
        riderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Rider",
        },
        name: String,
        phoneNumber: String,
      },
    ],
  }
);

export default mongoose.model("Vendor", vendorSchema);
