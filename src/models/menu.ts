import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface IMenu extends Document {
  vendorID: ObjectId;
  name: string;
  vendorName: string;
  vendorContact: string;
  category: string;
  dishType: string;
  description: string;
  price: number;
  image: string;
}
const menuSchema: Schema = new Schema(
  {
    vendorID: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    vendorName: {
      type: String,
    },
    vendorContact: {
      type: String,
    },
    category: {
      type: String,
    },
    dishType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMenu>("Menu", menuSchema);
