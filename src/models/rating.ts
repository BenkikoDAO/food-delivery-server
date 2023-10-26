import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface IRating extends Document {
  rating: number;
  vendorName: string;
  customerId: ObjectId;
}
const ratingsSchema: Schema = new Schema(
  {
    rating: {
      type: Number,
    },
    vendorName: {
      type: String,
    },
    customerId: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);
export default mongoose.model<IRating>("mobile-eat-ratings", ratingsSchema);
