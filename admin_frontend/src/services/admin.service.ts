import { Ajax } from '@/helper/ajax';

export const ADMIN_QUERY_KEY = ['admins'] as const;

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export const adminQueryKey = (params?: PaginationParams) => ['admins', params] as const;

export type Admin = {
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
  permission?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  deleted_at?: string;
};

export type CreateAdminPayload = {
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

export type AdminsResponse = {
  success: boolean;
  data: Admin[];
  message?: string;
};

/**
 * Fetch all admins from the API
 */
export const getAdmins = async (options?: { includeDeleted?: boolean }): Promise<Admin[]> => {
  try {
    const response = await Ajax.get('admin/admin');
    const admins = response.data || [];
    const normalized = admins.map((admin: any) => ({
      id: admin._id,
      ...admin,
      name: `${admin.first_name} ${admin.last_name}`.trim(),
      createdAt: admin.created_at || admin.createdAt || ''
    }));
    if (options?.includeDeleted) return normalized;
    return normalized.filter((admin: Admin) => !admin.deleted_at);
  } catch (error) {
    console.error('Error fetching admins:', error);
    throw error;
  }
};

/**
 * Fetch paginated admins from the API
 */
export const getAdminsPaginated = async (params: PaginationParams = {}): Promise<PaginatedResponse<Admin>> => {
  const { page = 1, per_page = 10 } = params;
  try {
    const response = await Ajax.get(`admin/admin?page=${page}&per_page=${per_page}`);
    const rawAdmins = response.data || [];
    const admins = rawAdmins.map((admin: any) => ({
      id: admin._id,
      ...admin,
      name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim(),
      createdAt: admin.created_at || admin.createdAt || ''
    })).filter((admin: Admin) => !admin.deleted_at);

    return {
      data: admins,
      total: response.total || rawAdmins.length,
      current_page: response.current_page || page,
      last_page: response.last_page || Math.ceil((response.total || rawAdmins.length) / per_page)
    };
  } catch (error) {
    console.error('Error fetching paginated admins:', error);
    throw error;
  }
};

/**
 * Get a single admin by ID
 */
export const getAdminById = async (id: string): Promise<Admin> => {
  const response = await Ajax.post('/admin/admin/update', { id });

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Admin not found');
  }

  const adminData = response.data || response;
  return {
    id: adminData._id || adminData.id,
    ...adminData,
    name: `${adminData.first_name} ${adminData.last_name}`.trim(),
    createdAt: adminData.created_at || adminData.createdAt || '',
  };
};

/**
 * Create a new admin
 */
export const createAdmin = async (adminData: CreateAdminPayload): Promise<any> => {
  try {
    const response = await Ajax.post('admin/admin/create', adminData);
    return response;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

/**
 * Update a admin
 */
export const updateAdmin = async (id: string, adminData: any): Promise<any> => {
  try {
    adminData.append('id', id);
    const response = await Ajax.post('/admin/admin/save', adminData);
    return response;
  } catch (error) {
    console.error('Error updating admin:', error);
    throw error;
  }
};

/**
 * Delete a admin
 */
export const deleteAdmin = async (id: string): Promise<void> => {
  try {
    await Ajax.delete(`admin/admin/${id}`);
  } catch (error) {
    console.error('Error deleting admin:', error);
    throw error;
  }
};

/**
 * Get all admin details (devices, activity) in a single API call
 */
export const getAdminDetails = async (adminId: string): Promise<{
  devices: any[];
  activity: any[];
}> => {
  try {
    const response = await Ajax.post(`/admin/admin/view`, { id: adminId });
    return {
      devices: response.data?.devices || [],
      activity: response.data?.activity || [],
    };
  } catch (error) {
    console.error('Error fetching admin details:', error);
    return {
      devices: [],
      activity: [],
    };
  }
};

