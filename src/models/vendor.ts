import mongoose, { Schema, Document } from "mongoose";

interface IRider {
  riderId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber: string;
  password: string;
  availability: string;
  email: string;
  image: string;
  paymail: string;
  secretKey: string;
  publicKey: string;
  address: string;
  latitude: number;
  longitude: number;
  licensePlate: string;
  licenseExpiry: string;
  id_image: string;
}

export interface IVendor extends Document {
  paymail: string;
  publicKey: string;
  secretKey: string;
  password: string;
  name: string;
  businessLogo: string;
  cuisine: string;
  phoneNumber: string;
  rating: number;
  benkikoToken: string;
  specialties: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  fcmToken: string | undefined;
  businessRegNo: string;
  HealthCertNo: string;
  riders: IRider[];
}

const vendorSchema: Schema = new mongoose.Schema({
  paymail: { type: String },
  publicKey: { type: String },
  secretKey: { type: String },
  password: { type: String },
  name: { type: String, unique: true },
  businessLogo: { type: String },
  cuisine: { type: String },
  phoneNumber: { type: String },
  rating: { type: Number, default: 0 },
  benkikoToken: { type: String },
  specialties: { type: [String] },
  latitude: { type: Number },
  longitude: { type: Number },
  locationName: { type: String },
  fcmToken: { type: String },
  businessRegNo: { type: String },
  HealthCertNo: { type: String },
  riders: [
    {
      riderId: {
        type: Schema.Types.ObjectId,
        ref: "Rider",
      },
      name: String,
      phoneNumber: String,
      password: String,
      availability: String,
      email: String,
      image: String,
      paymail: String,
      secretKey: String,
      publicKey: String,
      address: String,
      latitude: Number,
      longitude: Number,
      licensePlate: String,
      licenseExpiry: String,
      id_image: String,
    },
  ],
});

export default mongoose.model<IVendor>("Vendor", vendorSchema);
