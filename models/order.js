import mongoose from "mongoose";
const orderSchema = mongoose.Schema({
  orderNumber:{
    type: String
  },
  customerId:{
    type: mongoose.Schema.Types.ObjectId
  },
  vendorName:{
    type: String
  },
  customerCart:{
    type:Array
  },
  status: {
    type: String
  }
},{timestamps: true})
// const menuItemSchema = mongoose.Schema({
//     name: {
//       type: String,
//       required: true
//     },
//     quantity: {
//       type: Number,
//       required: true
//     },
//     price: {
//       type: Number,
//       required: true
//     }
//   });

// const orderSchema = mongoose.Schema({
//     vendorID: {
//         type: mongoose.Schema.Types.ObjectId,
//     },
//     customerID: {
//         type: mongoose.Schema.Types.ObjectId,
//         required: true 
//     },
//     customerName: {
//       type: String
//     },
//     customerContact: {
//       type: String
//     },
//     vendorName: {
//         type: String
//     },

// },  { timestamps: true })
export default mongoose.model("eatsOrder", orderSchema)