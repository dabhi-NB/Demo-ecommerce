import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWallet extends Document {
  user: Types.ObjectId;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWalletTransaction extends Document {
  wallet: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit';
  reason: 'refund' | 'order_payment' | 'admin_credit' | 'cashback' | 'withdrawal';
  orderId?: Types.ObjectId;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt?: Date;
}

const WalletSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    isActive: { type: Boolean, default: true },
  },
  { collection: 'wallets', timestamps: true }
);

const WalletTransactionSchema: Schema = new Schema(
  {
    wallet: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    reason: {
      type: String,
      enum: ['refund', 'order_payment', 'admin_credit', 'cashback', 'withdrawal'],
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    description: { type: String, default: '' },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { collection: 'wallet_transactions', timestamps: true }
);

export const Wallet = mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
export const WalletTransaction =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);

export default Wallet;
