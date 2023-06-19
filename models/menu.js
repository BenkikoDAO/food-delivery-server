import mongoose from "mongoose";
const menuSchema = new mongoose.Schema({
    vendorID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type:String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
    }

}, {timestamps: true})

export default mongoose.model("Menu", menuSchema)