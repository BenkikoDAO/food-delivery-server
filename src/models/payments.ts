import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface IPayment extends Document {
  data: {
    Message: string;
    Success: boolean;
    success: boolean;
  };
  transactionRef: string;
  payoutRef: string;
  transactionType: string;
  vendorId: ObjectId;
  riderId: ObjectId;
}
const paymentSchema: Schema = new Schema(
  {
    data: {
      type: Object,
    },
    transactionRef: {
      type: String,
    },
    payoutRef: {
      type: String,
    },
    transactionType: {
      type: String,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
    },
    riderId: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("mobile-eat-payment", paymentSchema);
