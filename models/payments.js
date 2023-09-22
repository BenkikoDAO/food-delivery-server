import mongoose from "mongoose";
const paymentSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

export default mongoose.model("mobile-eat-payment", paymentSchema);
