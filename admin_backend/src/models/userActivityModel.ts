import mongoose from 'mongoose';
import {GeneralHelper} from '../utils/general';

// Helper to generate Laravel-style ID
function generateId(length = 26) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Schema definition
const UserActivitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: () => generateId() },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ✅ ref added
    type: { type: Number, required: true },
    device_id: { type: String, required: true },
    ip: { type: String, required: true },
    client: { type: String },
   location: { type: String, default: '-' },

    created_at: { type: Date, default: Date.now },
  }, 
  { collection: 'user_activity' }
);

const UserActivityModel =
  mongoose.models.UserActivity || mongoose.model('UserActivity', UserActivitySchema);
export default UserActivityModel;
// Function to log activity
export async function logUserActivity(params: {
  user_id: mongoose.Types.ObjectId;
  type: number; // e.g., 1 = login, 4 = OTP login
  device_id: string;
  ip: string;
  client?: string;
}) {
  const { user_id, type, device_id, ip, client } = params;
   const location = await GeneralHelper.getIpLocation(ip);
  await UserActivityModel.create({
    user_id,
    type,
    device_id,
    ip,
    client,
     location,
  });
}



