import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

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
  timezone?: string;
  permission?: string;
  registered_ip?: string;
  status_tfa: number;
  otp?: string;
  otp_failed?: number;
  login_failed?: number;
  login_failed_at?: number;
  email_verified?: number;
  ignore_tfa_device?: string;
  status: number;
  totp_secret_key?: string;
  totp_backup_code?: string;
  addresses?: IAddress[];
  created_at?: Date;
  updated_at: Date;
  deleted_at?: Date | null;

}

const AddressSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema: Schema = new Schema({
  role: { type: Number },
  first_name: { type: String },
  last_name: { type: String },
  email: { type: String, unique: true, index: true },
  phone: { type: String, index: true },
  password: { type: String },
  image: { type: String },
  country: { type: String },
  timezone: { type: String, default: 'UTC' },
  permission: { type: String },
  registered_ip: { type: String },
  status_tfa: { type: Number, default: 0 },
  otp: { type: String },
  otp_failed: { type: Number },
  login_failed: { type: Number },
  login_failed_at: { type: Number },
  email_verified: { type: Number },
  ignore_tfa_device: { type: String },
  status: { type: Number, index: true, default: 1 },
  totp_secret_key: { type: String },
  totp_backup_code: { type: String },
  addresses: { type: [AddressSchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
});

export default mongoose.model<IUser>('User', UserSchema, 'user');
