import api from "./api";

// ==================== ADVANCED CACHE SYSTEM ====================
const CACHE_DURATIONS = {
    categories: 5 * 60 * 1000,  // 5min
    products: 2 * 60 * 1000,    // 2min (reduced from 10min)
    featuredProducts: 2 * 60 * 1000,  // 2min
    productDetail: 3 * 60 * 1000,    // 3min (reduced from 15min)
    searchResults: 2 * 60 * 1000,    // 2min
};

const STALE_TIME = 5 * 60 * 1000;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
    staleAt: number;
}

const memoryCache: Map<string, CacheEntry<any>> = new Map();

function generateCacheKey(prefix: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
        return prefix;
    }
    const sortedParams = Object.keys(params).sort()
        .map(key => `${key}=${JSON.stringify(params[key])}`)
        .join('&');
    return `${prefix}?${sortedParams}`;
}

function getCachedData<T>(key: string): T | null {
    const memEntry = memoryCache.get(key);
    if (memEntry && Date.now() < memEntry.expiresAt) {
        console.log(`[CACHE HIT - MEMORY] ${key}`);
        return memEntry.data as T;
    }

    try {
        const lsKey = `rv_cache_${key}`;
        const lsData = localStorage.getItem(lsKey);
        if (lsData) {
            const entry = JSON.parse(lsData) as CacheEntry<T>;
            if (Date.now() < entry.expiresAt) {
                console.log(`[CACHE HIT - STORAGE] ${key}`);
                memoryCache.set(key, entry);
                return entry.data;
            }
        }
    } catch (e) {
        console.warn('[CACHE] localStorage read error', e);
    }

    if (memEntry && Date.now() < memEntry.staleAt) {
        console.log(`[CACHE STALE] ${key} - returning stale data`);
        return memEntry.data as T;
    }

    try {
        const lsKey = `rv_cache_${key}`;
        const lsData = localStorage.getItem(lsKey);
        if (lsData) {
            const entry = JSON.parse(lsData) as CacheEntry<T>;
            if (Date.now() < entry.staleAt) {
                console.log(`[CACHE STALE - STORAGE] ${key}`);
                memoryCache.set(key, entry);
                return entry.data;
            }
        }
    } catch (e) { }

    console.log(`[CACHE MISS] ${key}`);
    return null;
}

function setCachedData<T>(key: string, data: T, duration: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        expiresAt: now + duration,
        staleAt: now + duration + STALE_TIME,
    };

    memoryCache.set(key, entry);

    try {
        const lsKey = `rv_cache_${key}`;
        localStorage.setItem(lsKey, JSON.stringify(entry));
    } catch (e) {
        console.warn('[CACHE] localStorage write error', e);
    }

    console.log(`[CACHE SET] ${key}, expires in ${duration / 1000}s`);
}

function cleanupOldCache(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('rv_cache_')) {
                try {
                    const data = localStorage.getItem(key);
                    if (data) {
                        const entry = JSON.parse(data);
                        if (Date.now() > entry.staleAt) {
                            keysToRemove.push(key);
                        }
                    }
                } catch { }
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch { }
}

export function clearProductCache(): void {
  console.log('[CACHE] Clearing product caches...');
  
  // Clear memory cache for product keys
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith('products') || key.startsWith('productDetail') || key.startsWith('featuredProducts')) {
      memoryCache.delete(key);
      console.log(`[CACHE CLEAR] Memory: ${key}`);
    }
  }
  
  // Clear localStorage product caches
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('rv_cache_') && 
          (key.includes('products') || key.includes('productDetail') || key.includes('featuredProducts'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
      console.log(`[CACHE CLEAR] LocalStorage: ${k}`);
    });
    console.log(`[CACHE CLEAR] Removed ${keysToRemove.length} product cache entries`);
  } catch (e) {
    console.warn('[CACHE CLEAR] localStorage error:', e);
  }
}

if (typeof window !== 'undefined') {
    cleanupOldCache();
}

// ==================== INTERFACES ====================

export type IProduct = Product;
export type ICategory = Category;

export interface ProductVariantOption {
    name: string;
    values: string[];
}

export interface ProductVariant {
    _id: string;
    combination: Array<{ name: string; value: string }>;
    price: number;
    salePrice?: number;
    stock: number;
    sku?: string;
    isActive: boolean;
    images?: string[];
}

export interface Product {
    _id: string;
    name: string;
    slug: string;
    description: string;
    category: {
        _id: string;
        name: string;
        slug: string;
    };
    brand: string;
    images: string[];
    price: number;
    salePrice?: number;
    stock: number;
    sku: string;
    ratings: {
        avg: number;
        count: number;
    };
    isFeatured: boolean;
    isActive: boolean;
    tags: string[];
    compatible?: string[];
    variants?: {
        color?: string;
        storage?: string;
        price: number;
        stock: number;
    }[];
    hasVariants?: boolean;
    variantOptions?: ProductVariantOption[];
    variantsNew?: ProductVariant[];
    totalStock?: number;
    minPrice?: number;
    maxPrice?: number;
    specs?: Record<string, string>;
}

export interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parent?: string;
    productCount?: number;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
}

export interface ProductFilters {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
    compatible?: string;
}

// ==================== PRODUCT SERVICE ====================

export const productService = {
    getProducts: async (filters: ProductFilters): Promise<ProductListResponse> => {
        const cacheKey = generateCacheKey('products', filters);
        const cached = getCachedData<ProductListResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const params = new URLSearchParams();
            if (filters.category) params.append("category", filters.category);
            if (filters.brand) params.append("brand", filters.brand);
            if (filters.minPrice) params.append("minPrice", filters.minPrice.toString());
            if (filters.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
            if (filters.rating) params.append("rating", filters.rating.toString());
            if (filters.sort) params.append("sort", filters.sort);
            if (filters.page) params.append("page", filters.page.toString());
            if (filters.limit) params.append("limit", filters.limit.toString());
            if (filters.search) params.append("search", filters.search);
            if (filters.compatible) params.append("compatible", filters.compatible);

            const queryString = params.toString();
            const url = queryString ? `products?${queryString}` : "products";

            const res = await api.get(url);
            const data = res.data;

            let result: ProductListResponse = { products: [], total: 0, page: 1, totalPages: 1 };

            if (data && data.success && data.data) {
                const innerData = data.data;
                if (Array.isArray(innerData)) {
                    result = { products: innerData, total: innerData.length, page: 1, totalPages: 1 };
                } else if (innerData.products && Array.isArray(innerData.products)) {
                    result = {
                        products: innerData.products,
                        total: innerData.total || innerData.products.length,
                        page: innerData.page || 1,
                        totalPages: innerData.totalPages || 1
                    };
                } else if (innerData.data && Array.isArray(innerData.data)) {
                    result = { products: innerData.data, total: innerData.data.length, page: 1, totalPages: 1 };
                }
            } else if (data && Array.isArray(data.products)) {
                result = {
                    products: data.products,
                    total: data.total || data.products.length,
                    page: data.page || 1,
                    totalPages: data.totalPages || 1
                };
            } else if (data && Array.isArray(data.data)) {
                result = { products: data.data, total: data.data.length, page: 1, totalPages: 1 };
            } else if (Array.isArray(data)) {
                result = { products: data, total: data.length, page: 1, totalPages: 1 };
            }

            setCachedData(cacheKey, result, CACHE_DURATIONS.products);
            return result;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch products");
        }
    },

    getProductBySlug: async (slug: string): Promise<Product> => {
        const cacheKey = generateCacheKey('productDetail', { slug });
        const cached = getCachedData<Product>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const res = await api.get(`products/slug/${slug}`);
            const data = res.data;
            let product: Product;

            if (data && data._id) {
                product = data as Product;
            } else if (data && data.data && data.data._id) {
                product = data.data as Product;
            } else {
                throw new Error("Product not found");
            }

            setCachedData(cacheKey, product, CACHE_DURATIONS.productDetail);
            return product;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch product");
        }
    },

    getFeaturedProducts: async (): Promise<Product[]> => {
        const cacheKey = generateCacheKey('featuredProducts');
        const cached = getCachedData<Product[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const res = await api.get("products/featured");
            const data = res.data;
            let products: Product[] = [];

            if (Array.isArray(data)) {
                products = data as Product[];
            } else if (data && Array.isArray(data.data)) {
                products = data.data as Product[];
            } else if (data && Array.isArray(data.products)) {
                products = data.products as Product[];
            }

            setCachedData(cacheKey, products, CACHE_DURATIONS.featuredProducts);
            return products;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch featured products");
        }
    },

    getRelatedProducts: async (productId: string, categoryId: string): Promise<Product[]> => {
        try {
            const res = await api.get(`products/${productId}/related?categoryId=${categoryId}`);
            const data = res.data;
            if (Array.isArray(data)) {
                return data as Product[];
            } else if (data && Array.isArray(data.data)) {
                return data.data as Product[];
            } else if (data && Array.isArray(data.products)) {
                return data.products as Product[];
            }
            return [];
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch related products");
        }
    },

    getCategories: async (): Promise<Category[]> => {
        const cacheKey = generateCacheKey('categories');
        const cached = getCachedData<Category[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const res = await api.get("categories");
            const data = res.data;
            let categories: Category[] = [];

            if (Array.isArray(data)) {
                categories = data as Category[];
            } else if (data && Array.isArray(data.data)) {
                categories = data.data as Category[];
            } else if (data && Array.isArray(data.categories)) {
                categories = data.categories as Category[];
            }

            setCachedData(cacheKey, categories, CACHE_DURATIONS.categories);
            return categories;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch categories");
        }
    },

    getCategoryBySlug: async (slug: string): Promise<Category> => {
        try {
            const res = await api.get(`categories/slug/${slug}`);
            const data = res.data;
            if (data && data._id) {
                return data as Category;
            } else if (data && data.data && data.data._id) {
                return data.data as Category;
            }
            throw new Error("Category not found");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to fetch category");
        }
    },

    searchProducts: async (query: string): Promise<Product[]> => {
        const cacheKey = generateCacheKey('searchResults', { q: query });
        const cached = getCachedData<Product[]>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            const res = await api.get(`/shop/search?q=${encodeURIComponent(query)}`);
            const data = res.data;
            let products: Product[] = [];

            if (Array.isArray(data)) {
                products = data as Product[];
            } else if (data && Array.isArray(data.data)) {
                products = data.data as Product[];
            } else if (data && Array.isArray(data.products)) {
                products = data.products as Product[];
            }

            setCachedData(cacheKey, products, CACHE_DURATIONS.searchResults);
            return products;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            throw new Error(err.response?.data?.message || "Failed to search products");
        }
    },
};

export const getCategories = () => productService.getCategories();
export const getCategoryBySlug = (slug: string) => productService.getCategoryBySlug(slug);
export const getProducts = (filters: ProductFilters) => productService.getProducts(filters);
export const getFeaturedProducts = () => productService.getFeaturedProducts();
export const getProductBySlug = (slug: string) => productService.getProductBySlug(slug);
export const getRelatedProducts = (productId: string, categoryId: string) =>
    productService.getRelatedProducts(productId, categoryId);
export const searchProducts = (query: string) => productService.searchProducts(query);

export const getProductVariants = async (slug: string) => {
  const res = await api.get(`/products/${slug}/variants`)
  return res.data.data
}
