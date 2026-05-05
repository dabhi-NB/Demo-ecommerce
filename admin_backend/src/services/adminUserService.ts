import User from '../models/userModel';
import Auth from '../models/authModel';
import { store } from './userService';
import logger from '../utils/logger';

export interface AdminUserServiceResponse {
  status: number;
  message: string;
  data?: any;
  pagination?: any;
}

/**
 * Admin User Service for handling admin user management operations
 */
export class AdminUserService {

  /**
   * Get all users with pagination
   */
  static async getAllUsers(page: number = 1, limit: number = 10): Promise<AdminUserServiceResponse> {
    try {
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password -otp -totp_secret_key -totp_backup_code')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments();

      return {
        status: 1,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in AdminUserService.getAllUsers:', error);
      return { status: 0, message: 'Failed to retrieve users' };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AdminUserServiceResponse> {
    try {
      const user = await User.findById(userId)
        .select('-password -otp -totp_secret_key -totp_backup_code');

      if (!user) {
        return { status: 0, message: 'User not found' };
      }

      return { status: 1, message: 'User retrieved successfully', data: user };
    } catch (error) {
      logger.error('Error in AdminUserService.getUserById:', error);
      return { status: 0, message: 'Failed to retrieve user' };
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData: any): Promise<AdminUserServiceResponse> {
    try {
      const result = await store(userData);
      return result;
    } catch (error) {
      logger.error('Error in AdminUserService.createUser:', error);
      return { status: 0, message: 'Failed to create user' };
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, userData: any): Promise<AdminUserServiceResponse> {
    try {
      const result = await store(userData, userId);
      return result;
    } catch (error) {
      logger.error('Error in AdminUserService.updateUser:', error);
      return { status: 0, message: 'Failed to update user' };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<AdminUserServiceResponse> {
    try {
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return { status: 0, message: 'User not found' };
      }

      // Also remove user sessions
      await Auth.deleteMany({ user_id: userId });

      logger.info(`User deleted by admin: ${user.email}`);
      return { status: 1, message: 'User deleted successfully' };
    } catch (error) {
      logger.error('Error in AdminUserService.deleteUser:', error);
      return { status: 0, message: 'Failed to delete user' };
    }
  }

  /**
   * Suspend user
   */
  static async suspendUser(userId: string): Promise<AdminUserServiceResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status: 'suspended', updated_at: new Date() },
        { new: true }
      ).select('-password -otp -totp_secret_key -totp_backup_code');

      if (!user) {
        return { status: 0, message: 'User not found' };
      }

      // Remove all user sessions
      await Auth.deleteMany({ user_id: userId });

      logger.info(`User suspended by admin: ${user.email}`);
      return { status: 1, message: 'User suspended successfully', data: user };
    } catch (error) {
      logger.error('Error in AdminUserService.suspendUser:', error);
      return { status: 0, message: 'Failed to suspend user' };
    }
  }

  /**
   * Activate user
   */
  static async activateUser(userId: string): Promise<AdminUserServiceResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status: 'active', updated_at: new Date() },
        { new: true }
      ).select('-password -otp -totp_secret_key -totp_backup_code');

      if (!user) {
        return { status: 0, message: 'User not found' };
      }

      logger.info(`User activated by admin: ${user.email}`);
      return { status: 1, message: 'User activated successfully', data: user };
    } catch (error) {
      logger.error('Error in AdminUserService.activateUser:', error);
      return { status: 0, message: 'Failed to activate user' };
    }
  }

  /**
   * Get user sessions
   */
  static async getUserSessions(userId: string): Promise<AdminUserServiceResponse> {
    try {
      const sessions = await Auth.find({ user_id: userId })
        .select('device_uid client ip created_at auth_token_expire_at')
        .sort({ updated_at: -1 });

      return { status: 1, message: 'User sessions retrieved successfully', data: sessions };
    } catch (error) {
      logger.error('Error in AdminUserService.getUserSessions:', error);
      return { status: 0, message: 'Failed to retrieve user sessions' };
    }
  }

  /**
   * Delete user session
   */
  static async deleteUserSession(userId: string, sessionId: string): Promise<AdminUserServiceResponse> {
    try {
      const result = await Auth.findOneAndDelete({
        _id: sessionId,
        user_id: userId
      });

      if (!result) {
        return { status: 0, message: 'Session not found' };
      }

      logger.info(`Admin deleted user session: ${sessionId} for user: ${userId}`);
      return { status: 1, message: 'Session deleted successfully' };
    } catch (error) {
      logger.error('Error in AdminUserService.deleteUserSession:', error);
      return { status: 0, message: 'Failed to delete session' };
    }
  }

  /**
   * Search users by query
   */
  static async searchUsers(query: string, page: number = 1, limit: number = 10): Promise<AdminUserServiceResponse> {
    try {
      const skip = (page - 1) * limit;

      const searchRegex = new RegExp(query, 'i');
      const searchFilter = {
        $or: [
          { first_name: searchRegex },
          { last_name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ]
      };

      const users = await User.find(searchFilter)
        .select('-password -otp -totp_secret_key -totp_backup_code')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(searchFilter);

      return {
        status: 1,
        message: 'Search results retrieved successfully',
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in AdminUserService.searchUsers:', error);
      return { status: 0, message: 'Failed to search users' };
    }
  }
}
