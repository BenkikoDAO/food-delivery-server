import mongoose, { Schema, Document } from "mongoose";
export interface Ilogs extends Document {
  timestamp: Date;
  message: string;
  level: string;
}

// Define a schema for your logs
const logSchema: Schema = new Schema({
  timestamp: Date, // Assuming your timestamps are Date objects
  message: String,
  level: String,
});

export default mongoose.model<Ilogs>("mobile-eats-logs", logSchema);
