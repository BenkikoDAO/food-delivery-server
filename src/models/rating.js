import mongoose from "mongoose";
const ratingsSchema = new mongoose.Schema({
    rating:{
        type:Number
    },
    vendorName:{
        type:String
    },
    customerId:{
        type: mongoose.Schema.Types.ObjectId
    }
},{timestamps: true})
export default mongoose.model("mobile-eat-ratings", ratingsSchema);
