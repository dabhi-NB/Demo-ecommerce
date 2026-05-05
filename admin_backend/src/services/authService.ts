import { Request } from 'express';
import mongoose from 'mongoose';
import User from '../models/adminModel';
import Auth from '../models/authModel';
import DeviceModel from '../models/deviceModel';
import UserActivityModel, { logUserActivity } from '../models/userActivityModel';
import { GeneralHelper } from '../utils/general';
import { rateLimit } from '../utils/rateLimit';
import { checkPassword } from '../utils/encryption';
import logger from '../utils/logger';

export interface AuthServiceResponse {
  http_status: number;
  status: number;
  message: string;
  data?: any;
}

/**
 * Auth Service for handling user authentication operations.
 */
export class AuthService {

  /**
   * Login user and create session
   */
  static async login(req: Request): Promise<AuthServiceResponse> {
    console.log('Login attempt for email:', req.body.email);

    try {
      const { email, password, device_uid } = req.body;
      // Rate limiting
      const rateLimitResult = await rateLimit(req, email, 5);
      if (!rateLimitResult.status) {
        return { http_status: 429, status: 0, message: rateLimitResult.message || 'Too many attempts' };
      }

      // User lookup
      const user = await User.findOne({ email });
      if (!user) {
        return { http_status: 401, status: 0, message: 'Invalid credentials' };
      }

      // Check password
      const isMatch = await checkPassword(password, user.password || '');
      if (!isMatch) {
        return { http_status: 401, status: 0, message: 'Invalid credentials' };
      }

      // Check if user is active
      console.log('User status:', user.status);
      if (user.status != 1) {
        return { http_status: 403, status: 0, message: 'Account suspended' };
      }

      // Generate unique auth token
      let auth_token: string;
      let tokenExists = true;
      do {
        auth_token = GeneralHelper.generateRandomAlnum(64);
        tokenExists = !!(await Auth.exists({ auth_token }));
      } while (tokenExists);

      const auth_token_expire_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const client = req.headers['user-agent'] || '';
      const timezone = req.body.timezone || 'UTC';

      // Check if device already has a session
      const existingAuth = await Auth.findOne({ device_uid: device_uid });
      const now = new Date();

      if (existingAuth) {
        // Update existing session
        existingAuth.user_id = user._id;
        existingAuth.auth_token = auth_token;
        existingAuth.auth_token_expire_at = auth_token_expire_at;
        existingAuth.timezone = timezone;
        existingAuth.client = client;
        existingAuth.ip = req.ip || '';
        existingAuth.updated_at = now;
        await existingAuth.save();
      } else {
        // Create new session
        await Auth.create({
          user_id: user._id,
          device_uid,
          auth_token,
          auth_token_expire_at,
          timezone,
          client,
          ip: req.ip,
          created_at: now,
          updated_at: now,
        });
      }

      // ✅ NEW: Upsert device record + log activity (avoids duplicate)
      const nowTs = new Date();
      await DeviceModel.findOneAndUpdate(
        { user_id: user._id, device_uid },
        {
          $set: {
            session_id: auth_token,
            client,
            ip: req.ip || '',
            last_activity: nowTs,
            last_login_at: nowTs,
            is_current_device: true,
            updated_at: nowTs
          }
        },
        { upsert: true, new: true }
      );
      logger.info(`✅ Device upserted: user_id=${user._id}, device_uid=${device_uid}`);

      await logUserActivity({
        user_id: user._id,
        type: 1, // Login success
        device_id: device_uid,
        ip: req.ip || '',
        client
      });
      logger.info(`✅ Activity logged: user_id=${user._id}, type=1`);

      logger.info(`User logged in: ${email}`);
      return {
        http_status: 200,
        status: 1,
        message: 'Login successful',
        data: {
          token: auth_token,
          user: {
            user_id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            image: user.image,
            permission: user.permission  // ✅ ADD THIS - Include permissions in login response
          }
        }
      };

    } catch (error) {
      logger.error('Error in AuthService.login:', error);
      return { http_status: 500, status: 0, message: 'Login failed' };
    }
  }

  /**
   * Logout user by removing session
   */
  static async logout(authToken: string): Promise<AuthServiceResponse> {
    try {
      const result = await Auth.findOneAndDelete({ auth_token: authToken });

      if (!result) {
        return { http_status: 404, status: 0, message: 'Session not found' };
      }

      logger.info(`User logged out, session deleted`);
      return { http_status: 200, status: 1, message: 'Logout successful' };

    } catch (error) {
      logger.error('Error in AuthService.logout:', error);
      return { http_status: 500, status: 0, message: 'Logout failed' };
    }
  }

  /**
   * Refresh user authentication token
   */
  static async refreshToken(authToken: string): Promise<AuthServiceResponse> {
    try {
      const authDoc = await Auth.findOne({ auth_token: authToken });

      if (!authDoc) {
        return { http_status: 401, status: 0, message: 'Invalid token' };
      }

      // Extend token expiry by 30 days
      authDoc.auth_token_expire_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      authDoc.updated_at = new Date();
      await authDoc.save();

      logger.info(`Token refreshed for user: ${authDoc.user_id}`);
      return { http_status: 200, status: 1, message: 'Token refreshed successfully' };

    } catch (error) {
      logger.error('Error in AuthService.refreshToken:', error);
      return { http_status: 500, status: 0, message: 'Token refresh failed' };
    }
  }

  /**
 * Get all active devices with user details
 */
  static async getActiveDevices(userId?: mongoose.Types.ObjectId): Promise<AuthServiceResponse> {
    try {
      const where: any = {};
      if (userId) where.user_id = userId;

      // Use DeviceModel (correct table)
      const devices = await DeviceModel.find(where).lean();

      // Join timezone from Auth table
      const formatted = await Promise.all(devices.map(async (d: any) => {
        let location = d.timezone || '-';
        let name = '-';
        let email = '-';
        if (d.device_uid) {
          try {
            const authRecord = await Auth.findOne({ device_uid: d.device_uid }).select('timezone');
            location = authRecord?.timezone || '-';
            const userRecord = await User.findById(d.user_id).select('first_name last_name email');
            name = userRecord ? `${userRecord.first_name ?? ''} ${userRecord.last_name ?? ''}`.trim() : '-';
            email = userRecord?.email ?? '';
          } catch { }
        }

        return {
          id: d.id,
          _id: d._id,
          user_id: d.user_id?._id,
          user_type: 1, // admin
          client: d.client,
          ip: d.ip,
          last_activity: d.updated_at,
          name,
          email,
          location,
          image: d.user_id?.image
        };
      }));

      return {
        http_status: 200,
        status: 1,
        message: 'Active devices fetched successfully',
        data: formatted
      };
    } catch (error) {
      logger.error('getActiveDevices error:', error);
      return {
        http_status: 500,
        status: 0,
        message: 'Failed to fetch devices'
      };
    }
  }

  /**
  * Force logout a device by auth/device ID
  */

  static async forceLogoutDevice(deviceId: string): Promise<AuthServiceResponse> {
    try {
      // Find device record first
      const device = await DeviceModel.findById(deviceId);
      if (!device) {
        return { http_status: 404, status: 0, message: 'Device not found' };
      }

      const deviceUid = device.device_uid;

      // Delete ALL auth sessions for this device_uid
      await Auth.deleteMany({ device_uid: deviceUid });

      // Delete device record
      await DeviceModel.findByIdAndDelete(deviceId);

      logger.info(`Force logout: deviceId=${deviceId}, device_uid=${deviceUid}`);

      return {
        http_status: 200,
        status: 1,
        message: 'Device logged out successfully',
      };
    } catch (error) {
      logger.error('forceLogoutDevice error:', error);
      return {
        http_status: 500,
        status: 0,
        message: 'Failed to logout device',
      };
    }
  }

  /**
     * Get all user activities (for admin dashboards)
     */

  static mapType(type: number): string {
    switch (type) {
      case 0: return 'Login failed';
      case 1: return 'Login success';
      case 3: return 'Register';
      case 4: return 'Login with OTP';
      case 5: return 'Login with social media';
      default: return 'Login with remember';
    }
  }

  static async getAllUserActivities(userId?: mongoose.Types.ObjectId): Promise<AuthServiceResponse> {
    try {
      const where: any = {};
      if (userId) where.user_id = userId;

      const activities = await UserActivityModel.find(where).lean();

      const formatted = await Promise.all(activities.map(async (row: any) => {
        let location = row.location || '-';
        let name = '-';
        let email = '-';
        if (row.device_id) {
          try {
            const authRecord = await Auth.findOne({ device_uid: row.device_id }).select('timezone');
            location = authRecord?.timezone || row.location || '-';
            const userRecord = await User.findById(row.user_id).select('first_name last_name email');
            name = userRecord ? `${userRecord.first_name ?? ''} ${userRecord.last_name ?? ''}`.trim() : '-';
            email = userRecord?.email ?? '';
          } catch { }
        }

        return {
          _id: row._id,
          id: row.id,
          user_id: row.user_id?._id,
          user_type: 1,
          device_id: row.device_id,
          ip: row.ip,
          client: row.client,
          location,
          created_at: row.created_at,
          name,
          email,
          image: row.user_id?.image
        };
      }));

      return {
        http_status: 200,
        status: 1,
        message: 'Active user acitvity fetched successfully',
        data: formatted
      };
    } catch (error) {
      logger.error('getAllUserActivities error:', error);
      return {
        http_status: 500,
        status: 0,
        message: 'Failed to fetch devices'
      };
    }
  }
}



// Legacy function for backward compatibility
export const loginService = AuthService.login;
