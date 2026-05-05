import { Ajax } from '@/helper/ajax';

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Fetch all categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await Ajax.get('admin/categories');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

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

/**
 * Fetch paginated categories
 */
export const getCategoriesPaginated = async (params: PaginationParams = {}): Promise<PaginatedResponse<Category>> => {
  const { page = 1, per_page = 10 } = params;
  try {
    const response = await Ajax.get(`admin/categories?page=${page}&per_page=${per_page}`);
    const rawCategories = response.data || [];
    const categories = rawCategories.map((cat: any) => ({
      _id: cat._id,
      ...cat,
      createdAt: cat.createdAt || cat.created_at || '',
      isActive: cat.is_active === 1 || cat.isActive === true || cat.isActive === 1
    }));
    
    return {
      data: categories,
      total: response.total || rawCategories.length,
      current_page: response.current_page || page,
      last_page: response.last_page || Math.ceil((response.total || rawCategories.length) / per_page)
    };
  } catch (error) {
    console.error('Error fetching paginated categories:', error);
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: string): Promise<Category> => {
  try {
    const response = await Ajax.get(`admin/categories/${id}`);
    return response.data || response;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * Get categories for select dropdown
 */
export const getCategoriesForSelect = async (): Promise<{ label: string; value: string }[]> => {
  try {
    const response = await Ajax.get('admin/categories/select');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching categories for select:', error);
    throw error;
  }
};

/**
 * Create a new category
 */
export const createCategory = async (formData: FormData): Promise<any> => {
  try {
    const response = await Ajax.postWithFormData('admin/categories/create', formData);
    return response;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

/**
 * Update a category
 */
export const updateCategory = async (id: string, formData: FormData): Promise<any> => {
  try {
    const response = await Ajax.postWithFormData(`admin/categories/update/${id}`, formData);
    return response;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<any> => {
  try {
    const response = await Ajax.delete(`admin/categories/delete/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
