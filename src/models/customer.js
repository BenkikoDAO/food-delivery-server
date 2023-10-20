import mongoose from "mongoose";
const customerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    token: {
      type: String,
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
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
