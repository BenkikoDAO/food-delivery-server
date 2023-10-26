import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface IOrder extends Document {
  orderNumber: string;
  customerId: ObjectId;
  vendorName: string;
  customerCart: any[];
  status: string;
  totalAmount: number;
  riderId: ObjectId;
  riderName: string;
}
const orderSchema: Schema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
    },
    customerId: {
      type: Schema.Types.ObjectId,
    },
    vendorName: {
      type: String,
    },
    customerCart: {
      type: Array,
    },
    status: {
      type: String,
    },
    totalAmount: {
      type: Number,
    },
    riderId: {
      type: Schema.Types.ObjectId,
    },
    riderName: {
      type: String,
    },
  },
  { timestamps: true }
);
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
export default mongoose.model<IOrder>("eatsOrder", orderSchema);
