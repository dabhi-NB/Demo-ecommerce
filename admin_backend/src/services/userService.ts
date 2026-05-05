import User from '../models/userModel';
import { encryptPassword } from '../utils/encryption';
import logger from '../utils/logger';

export interface UserServiceResponse {
  http_status: number;
  status: number;
  message: string;
  data?: any;
}

/**
 * User Service for handling user-related operations.
 */
export class UserService {
  
  /**
   * Store (create or update) user data
   */
  static async store(data: any, userId?: string): Promise<UserServiceResponse> {
    try {
      if (data.password) {
        data.password = await encryptPassword(data.password);
      }
      
      let user;
      if (userId) {
        // Update existing user
        user = await User.findByIdAndUpdate(userId, data, { new: true })
          .select('-password -otp -totp_secret_key -totp_backup_code');
        if (!user) {
          return { http_status: 404, status: 0, message: 'User not found' };
        }
        logger.info(`User updated: ${user.email}`);
        return { http_status: 200, status: 1, message: 'User updated successfully', data: { user } };
      } else {
        // Create new user
        data.role = 4; // Regular user role
        data.status = 'active';
        data.created_at = new Date();
        data.updated_at = new Date();
        
        user = new User(data);
        await user.save();
        
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.otp;
        delete userResponse.totp_secret_key;
        delete userResponse.totp_backup_code;
        
        logger.info(`User created: ${user.email}`);
        return { http_status: 201, status: 1, message: 'User created successfully', data: { user: userResponse } };
      }
      
    } catch (error) {
      logger.error('Error in UserService.store:', error);
      return { http_status: 500, status: 0, message: userId ? 'User update failed' : 'User creation failed' };
    }
  }
}

// Legacy function for backward compatibility
export const store = UserService.store;
