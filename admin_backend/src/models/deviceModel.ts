import mongoose from "mongoose";

// ULID / Random string helper
function generateId(length = 32) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const DeviceSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => generateId(),
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    device_uid: {
      type: String,
      required: true,
      index: true,
    },

    session_id: {
      type: String,
      default: "",
      index: true,
    },

    remember_token: {
      type: String,
      default: null,
      index: true,
    },

    remember_expire_at: {
      type: Number,
      default: 0,
    },

    client: {
      type: String,
      required: true,
    },

    ip: {
      type: String,
      required: true,
    },

    is_current_device: {
      type: Boolean,
      default: false,
      index: true,
    },

    last_activity: {
      type: Date,
      default: Date.now,
    },
     last_login_at: { type: Date },
     
  },
  {
    collection: "device",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// ❗ Ensure combination of user + device_uid is unique
DeviceSchema.index({ user_id: 1, device_uid: 1 }, { unique: true });

const DeviceModel =
  mongoose.models.Device || mongoose.model("Device", DeviceSchema);

export default DeviceModel;
