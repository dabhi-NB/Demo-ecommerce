import mongoose, { Schema, Document } from "mongoose";

export interface IUserSendMail extends Document {
  user_id?: mongoose.Types.ObjectId;
  to_user: string;
  subject: string;
  message: string;
  created_at: Date;
  updated_at: Date;
}

const userSendMailSchema = new Schema<IUserSendMail>(
  {
    user_id: {
      type: mongoose.Types.ObjectId,
      required: false,
      default: null,
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
    collection: "user_sendmail", // ✅ EXACT SQL table name (AS YOU GAVE)
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model<IUserSendMail>(
  "userSendMailModel", // ✅ Model name (Node side)
  userSendMailSchema
);
