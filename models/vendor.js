import mongoose from "mongoose";
const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type:String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    location: {
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
    openingHours: {
        type: String,
        required: true
    },
    closingHours: {
        type: String,
        require: true
    },
    businessRegistration: {
        data: Buffer,
        contentType: String
    }

}, {timestamps: true})

export default mongoose.model("Vendor", vendorSchema)