import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserSendMail extends Document {
  user_id: Types.ObjectId;
  to_user: string;
  subject: string;
  message: string;
  created_at: Date;
  updated_at: Date;
}

const userSendMailSchema = new Schema<IUserSendMail>(
  {
   user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to_user: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    collection: 'user_sendmail',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model<IUserSendMail>('userSendMailModel', userSendMailSchema);