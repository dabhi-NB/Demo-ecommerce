import mongoose, { Document, Schema } from 'mongoose';

export interface ISetting extends Document {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: string;
  type: number; // 0 for public, 1 for private
  created_at?: Date;
  updated_at: Date;
}
   
const SettingSchema: Schema = new Schema({
  key: { type: String, unique: true, index: true, required: true },
  value: { type: String, required: true },
  type: { type: Number, default: 0, index: true }, // 0 = public, 1 = private
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { collection: 'setting' });

export default mongoose.model<ISetting>('Setting', SettingSchema);
