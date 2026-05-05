import { Ajax } from '@/helper/ajax';

export const USERS_QUERY_KEY = ['users'] as const;

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  phone?: string;
  country?: string;
  role: number;
  status: 1 | 0;
  image?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  timezone?: string;
  registered_ip?: string;
  deleted_at?: string;
};

export type CreateUserPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country?: string;
  role: number;
  status: 1 | 0;
  password?: string;
  image?: string;
};

export type UsersResponse = {
  success: boolean;
  data: User[];
  message?: string;
};


/**
 * Fetch all users from the API
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await Ajax.get('admin/users');
    const users = response.data || [];
    const normalized = users.map((user: any) => ({
      id: user._id,
      ...user,
      name: `${user.first_name} ${user.last_name}`.trim(),
      createdAt: user.created_at || user.createdAt || ''
    }));
    return normalized;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get a single user by ID
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await Ajax.post('/admin/users/update', { id });

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'User not found');
  }

  const userData = response.data || response;
  return {
    id: userData._id || userData.id,
    ...userData,
    name: `${userData.first_name} ${userData.last_name}`.trim(),
    createdAt: userData.created_at || userData.createdAt || '',
  };
};

/**
 * Create a new user
 */
export const createUser = async (userData: CreateUserPayload): Promise<any> => {
  try {
    const response = await Ajax.post('admin/users/create', userData);
    return response;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update a user
 */
export const updateUser = async (id: string, userData: any): Promise<any> => {
  try {
    userData.append('id', id);
    const response = await Ajax.post('/admin/users/save', userData);
    return response;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Permanently delete a user
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await Ajax.delete(`admin/users/${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get all user details (devices, activity, mails) in a single API call
 */
export const getUserDetails = async (userId: string): Promise<{
  devices: any[];
  activity: any[];
  mails: any[];
}> => {
  try {
    const response = await Ajax.post(`/admin/user/view`, { id: userId, length: 1000 });
    return {
      devices: response.data?.devices || [],
      activity: response.data?.activity || [],
      mails: response.data?.mails || [],
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return {
      devices: [],
      activity: [],
      mails: [],
    };
  }
};

/**
 * Send a mail to a user
 */
// user.service.ts
export const sendMail = async (payload: { to: string; subject: string; message: string }) => {
  try {
    const response = await Ajax.post('admin/user/mail', payload);

    return {
      status: response.status,        // 1 = success
      message: response.message,      // string
      data: response.data || null,
    };
  } catch (error: any) {
    return {
      status: 0,
      message: error?.message || 'Failed to send mail',
      data: null,
    };
  }
};

/**
 * Auto login as user
 */
export const autoLogin = async (userId: string): Promise<any> => {
  try {
    const response = await Ajax.post('admin/user/autologin', { id: userId });
    return response;
  } catch (error) {
    console.error('Error auto logging in as user:', error);
    throw error;
  }
};

/**
 * Send TFA mail to user
 */
export const sendTfaMail = async (userId: string): Promise<any> => {
  try {
    const response = await Ajax.post('admin/user/send-tfa-mail', { id: userId });
    return response;
  } catch (error) {
    console.error('Error sending TFA mail:', error);
    throw error;
  }
};

