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
});

export default mongoose.model("Rider", riderSchema);
