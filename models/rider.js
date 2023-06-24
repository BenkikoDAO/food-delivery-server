import mongoose from "mongoose";
const riderSchema = new mongoose.Schema({
  name: {
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
  isOccupied: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model("Rider", riderSchema);
