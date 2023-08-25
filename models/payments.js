import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
    data:{
        type: String
    }
},{timestamps: true})

export default mongoose.model("mobile-eat-payment", paymentSchema);