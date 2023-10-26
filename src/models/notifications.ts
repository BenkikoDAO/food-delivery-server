import mongoose, { Schema, Document, ObjectId } from "mongoose";
export interface INotification extends Document {
  vendorId: ObjectId;
  message: string;
  riderId: ObjectId;
}
const notificationSchema: Schema = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
    },
    message: {
      type: String,
    },
    riderId: {
      type: Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>(
  "eatsNotifications",
  notificationSchema
);
