import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
    data:{
        type: Object
    }
},{timestamps: true})

export default mongoose.model("mobile-eat-payment", paymentSchema);