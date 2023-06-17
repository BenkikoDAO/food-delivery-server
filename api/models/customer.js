import mongoose from "mongoose";
const customerSchema = new mongoose.Schema({
    username: {
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
      }

}, {timestamps: true})

export default mongoose.model("customer", customerSchema)