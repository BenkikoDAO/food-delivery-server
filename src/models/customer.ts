import mongoose, { Schema, Document } from "mongoose";
export interface ICustomer extends Document {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  token: string;
  location: {
    type: string; // Should be "Point"
    coordinates: [number, number]; // Array of [longitude, latitude]
  };
}
const customerSchema: Schema = new Schema(
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

export default mongoose.model<ICustomer>("Customer", customerSchema);
