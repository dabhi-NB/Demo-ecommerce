import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  role?: number;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  password?: string;
  image?: string;
  country?: string;
  timezone: string;
  permission?: string;
  registered_ip?: string;
  status_tfa: number;
  otp?: string;
  otp_failed?: number;
  login_failed?: number;
  login_failed_at?: Date;
  email_verified?: number;
  ignore_tfa_device?: string;
  status: Number;
  totp_secret_key?: string;
  backup_code?: string;
  addresses?: Array<{
    _id?: mongoose.Types.ObjectId
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    pincode: string
    isDefault: boolean
    createdAt?: Date
  }>
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema<IUser> = new Schema({
  role: { type: Number, index: true },
  first_name: { type: String, index: true },
  last_name: { type: String, index: true },
  email: { type: String, unique: true, index: true, required: true },
  phone: { type: String, unique: true, index: true },
  password: { type: String },
  image: { type: String },
  country: { type: String },
  timezone: { type: String, default: "UTC" },
  permission: { type: String },
  registered_ip: { type: String },
  status_tfa: { type: Number, default: 0 },
  otp: { type: String },
  otp_failed: { type: Number },
  login_failed: { type: Number },
  login_failed_at: { type: Date },
  email_verified: { type: Number },
  ignore_tfa_device: { type: String },
  status: { type: Number, default: 1, index: true },
  totp_secret_key: { type: String },
  backup_code: { type: String },
  addresses: [{
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Optional: automatically update `updated_at` on save
UserSchema.pre<IUser>("save", function (next) {
  this.updated_at = new Date();
  next();
});

const UserModel = mongoose.model<IUser>("User", UserSchema, "user");

export default UserModel;
