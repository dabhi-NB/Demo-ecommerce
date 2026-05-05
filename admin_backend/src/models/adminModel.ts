import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  role?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: any;
  image?: string;
  country?: string;
  permission?: string;
  registered_ip?: string;
  status_tfa: number; // 0 | 1
  otp?: string;
  otp_failed?: number;
  login_failed?: number;
  login_failed_at?: number;
  email_verified?: number;
  ignore_tfa_device?: string;
  status: number;
  totp_secret_key?: string;
  totp_backup_code?: string;
  created_at?: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema({
  role: { type: Number },
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, unique: true, index: true },
  phone: { type: String, index: true },
  password: { type: String },
  image: { type: String },
  country: { type: String },
  permission: { type: String },
  registered_ip: { type: String },
  status_tfa: { type: Number, default: 0, },// 0 = disabled, 1 = enabled
  otp: { type: String },
  otp_failed: { type: Number },
  login_failed: { type: Number },
  login_failed_at: { type: Number },
  email_verified: { type: Number },
  ignore_tfa_device: { type: String },
  status: { type: Number, index: true },
  totp_secret_key: { type: String },
  totp_backup_code: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('Admin', UserSchema, 'admin');
