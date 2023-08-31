import mongoose from 'mongoose';
const cartSchema = new mongoose.Schema({
    customer: {
        type: String
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    customerContact:{
        type: String
    },
    customerEmail:{
        type: String
    },
    itemId:{
        type: mongoose.Schema.Types.ObjectId,
        // required: true
    },
    vendorName:{
        type:String
    },
    vendorContact:{
        type: String
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
        type: Number,
    },
    image:{
        type: String
    },
    extraNote:{
        type: String
    },
    deliveryAddress: {
        type: {
            type: String,
            enum: ['Point'], // Specify the type as "Point"
            // required: true
          },
          coordinates: {
            type: [Number], // Array of [longitude, latitude] values
            // required: true
          }
    },
    streetAddress:{
        type: String
    },
    deliveryDate:{
        type: String
    },
    deliveryTime:{
        type: String
    },
    deliveryFee:{
        type: Number,
        default:0
    },
    vendorNames:{
        type: Array
    }
}, {timestamps: true})

export default mongoose.model("eatsCart", cartSchema)