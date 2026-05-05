import { Ajax } from '@/helper/ajax';

export const PRODUCTS_QUERY_KEY = ['products'] as const;

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  salePrice?: number;
  stock: number;
  sku?: string;
  weight?: number;
  category?: {
    id: string;
    name: string;
  };
  brand?: string;
  isActive: boolean;
  isFeatured?: boolean;
  tags?: string[];
  specifications?: { key: string; value: string }[];
  compatibleWith?: string[];
  // Variants
  variantOptions?: Array<{ name: string; values: string[] }>;
  variants?: Array<{
    _id?: string;
    combination: Array<{ name: string; value: string }>;
    sku?: string;
    price?: number;
    salePrice?: number;
    stock?: number;
    isActive?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProductPayload = {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  images?: File[];
  price: number;
  originalPrice?: number;
  stock?: number;
  sku?: string;
  categoryId?: string;
  brand?: string;
  isActive?: boolean;
  isFeatured?: boolean;
};

export type ProductsResponse = {
  success: boolean;
  data: Product[];
  message?: string;
};

/**
 * Fetch all products from the API
 */
export const getProducts = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
  per_page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}): Promise<{ products: Product[]; total: number }> => {
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
    const url = queryString ? `admin/products?${queryString}` : 'admin/products';
    const response = await Ajax.get(url);
    
    // Map _id to id for each product
    const products = (response.data || []).map((product: any) => ({
      ...product,
      id: product._id || product.id,
      category: product.category ? {
        id: product.category._id || product.category.id,
        name: product.category.name
      } : undefined
    }));
    
    return {
      products,
      total: response.total || 0,
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id: string): Promise<Product> => {
  const response = await Ajax.get(`/admin/products/${id}`);

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Product not found');
  }

  const productData = response.data || response;
  return {
    id: productData._id || productData.id,
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    shortDescription: productData.shortDescription,
images: Array.isArray(productData.images) ? productData.images : [],
    price: productData.price,
    originalPrice: productData.originalPrice,
    salePrice: productData.salePrice,
    stock: productData.stock,
    sku: productData.sku,
    weight: productData.weight,
    category: productData.category ? {
      id: productData.category._id || productData.category.id,
      name: productData.category.name
    } : undefined,
    brand: productData.brand,
    isActive: productData.isActive,
    isFeatured: productData.isFeatured,
tags: productData.tags || [],
specifications: productData.specifications || [],
compatibleWith: productData.compatibleWith || [],
variantOptions: productData.variantOptions || [],
variants: (productData.variants || []).map((v: any) => ({
  ...v,
  combination: Array.isArray(v.combination) ? v.combination : [],
})) as any[],
    createdAt: productData.created_at || productData.createdAt || '',
    updatedAt: productData.updated_at || productData.updatedAt || '',
  };
};

/**
 * Create a new product
 */
export const createProduct = async (formData: FormData): Promise<any> => {
  try {
    const response = await Ajax.post('admin/products/create', formData);
    return response;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update a product
 */
export const updateProduct = async (id: string, formData: FormData): Promise<any> => {
  try {
    const response = await Ajax.post(`/admin/products/update/${id}`, formData);
    return response;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Update product images only
 */
export const updateProductImages = async (id: string, formData: FormData): Promise<any> => {
  try {
    const response = await Ajax.post(`/admin/products/images/${id}`, formData);
    return response;
  } catch (error) {
    console.error('Error updating product images:', error);
    throw error;
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (id: string, stock: number): Promise<any> => {
  try {
    const response = await Ajax.request(`/admin/products/update/stock/${id}`, { stock }, 'patch');
    return response;
  } catch (error) {
    console.error('Error updating product stock:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await Ajax.delete(`admin/products/delete/${id}`);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

