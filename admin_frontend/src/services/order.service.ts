import { Ajax } from '@/helper/ajax';

export const ORDERS_QUERY_KEY = ['orders'] as const;

export type OrderItem = {
  product: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  variant?: {
    color?: string;
    storage?: string;
  };
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type OrderTimeline = {
  status: string;
  time: string;
  note?: string;
};

export type OrderUser = string | { _id?: string; id?: string;[key: string]: any };

export type Order = {
  id: string;
  orderNumber: string;
  user: OrderUser;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: 'cod' | 'online';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentId?: string;
  status: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  couponCode?: string;
  couponDiscount?: number;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  estimatedDelivery?: string;
  timeline: OrderTimeline[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderStats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  lowStockProducts: {
    name: string;
    stock: number;
  }[];
};


/**
 * Fetch all orders from the API
 */
export const getOrders = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  paymentStatus?: string;
}): Promise<{ orders: Order[]; total: number }> => {
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
    const url = queryString ? `admin/orders?${queryString}` : 'admin/orders';
    const response = await Ajax.get(url);
    const orders = (response.data || []).map((order: any) => ({
      id: order._id || order.id,
      ...order,
    }));
    return {
      orders,
      total: response.total || 0,
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (id: string): Promise<Order> => {
  const response = await Ajax.get(`/admin/orders/${id}`);

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Order not found');
  }

  const orderData = response.data || response;
  return {
    id: orderData._id || orderData.id,
    ...orderData,
    createdAt: orderData.created_at || orderData.createdAt || '',
    updatedAt: orderData.updated_at || orderData.updatedAt || '',
  };
};

/**
 * Get order statistics
 */
export const getOrderStats = async (): Promise<OrderStats> => {
  try {
    const response = await Ajax.get('admin/orders/stats');
    return response.data || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      totalProducts: 0,
      lowStockProducts: [],
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    throw error;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (id: string, status: string, note?: string): Promise<any> => {
  try {
    const response = await Ajax.request(`/admin/orders/status/${id}`, { status, note }, 'patch');
    return response;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Get orders containing a specific product
 */
export const getOrdersByProduct = async (productId: string, limit: number = 5): Promise<Order[]> => {
  try {
    const response = await Ajax.get(`admin/orders?productId=${productId}&limit=${limit}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching orders by product:', error);
    throw error;
  }
};
