import mongoose, { Document, Schema } from 'mongoose';

export interface IAuth extends Document {
  user_id: mongoose.Types.ObjectId;
  device_uid: string;
  auth_token?: string;
  auth_token_expire_at: Date;
  timezone: String,
  client: string;
  ip: string;
  created_at: Date;
  updated_at: Date;
}

const AuthSchema: Schema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  device_uid: { type: String, required: true, index: true },
  auth_token: { type: String, index: true },
  auth_token_expire_at: { type: Date, required: true },
  timezone: { type: String, default: 'UTC' },
  client: { type: String, required: true },
  ip: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<IAuth>('Auth', AuthSchema, 'auth');
