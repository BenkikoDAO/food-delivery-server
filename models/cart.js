import mongoose from 'mongoose';
const cartSchema = new mongoose.Schema({
    customer: {
        type: String
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    itemId:{
        type: mongoose.Schema.Types.ObjectId,
        // required: true
    },
    vendorName:{
        type:String
    },
    name:{
        type: String
    },
    description:{
        type: String
    },
    quantity:{
        type: Number,
        default: 1
    },
    price:{
        type: String,
    },
    image:{
        type: String
    },
    extraNote:{
        type: String
    }
}, {timestamps: true})

export default mongoose.model("eatsCart", cartSchema)