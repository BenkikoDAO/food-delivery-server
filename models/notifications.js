import mongoose, { Mongoose } from 'mongoose'
const notificationSchema = new mongoose.Schema({
    vendorId:{
        type: mongoose.Schema.Types.ObjectId
    },
    message:{
        type: String
    }
}, {timestamps: true})

export default mongoose.model("eatsNotifications", notificationSchema)