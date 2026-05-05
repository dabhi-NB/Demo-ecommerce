import { Ajax } from '@/helper/ajax';

export const COUPONS_QUERY_KEY = ['coupons'] as const;

export type Coupon = {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCouponPayload = {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
};


/**
 * Fetch all coupons from the API
 */
export const getCoupons = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ coupons: Coupon[]; total: number }> => {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    const url = queryString ? `admin/coupons?${queryString}` : 'admin/coupons';
    const response = await Ajax.get(url);

    // Map _id to id for each coupon
    const coupons = (response.data || []).map((coupon: any) => ({
      ...coupon,
      id: coupon._id || coupon.id,
    }));

    return {
      coupons,
      total: response.total || 0,
    };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
};

/**
 * Get a single coupon by ID
 */
export const getCouponById = async (id: string): Promise<Coupon> => {
  const response = await Ajax.get(`/admin/coupons/${id}`);

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Coupon not found');
  }

  const couponData = response.data || response;
  return {
    id: couponData._id || couponData.id,
    ...couponData,
    createdAt: couponData.created_at || couponData.createdAt || '',
    updatedAt: couponData.updated_at || couponData.updatedAt || '',
  };
};

/**
 * Create a new coupon
 */
export const createCoupon = async (couponData: CreateCouponPayload): Promise<any> => {
  try {
    const response = await Ajax.post('admin/coupons/create', couponData);
    return response;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};

/**
 * Update a coupon
 */
export const updateCoupon = async (id: string, couponData: CreateCouponPayload): Promise<any> => {
  try {
    const response = await Ajax.put(`/admin/coupons/update/${id}`, couponData);
    return response;
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
};

/**
 * Delete a coupon
 */
export const deleteCoupon = async (id: string): Promise<void> => {
  try {
    await Ajax.delete(`admin/coupons/delete/${id}`);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};
