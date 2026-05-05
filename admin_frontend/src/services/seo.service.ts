import { Ajax } from '@/helper/ajax';

export const seoQueryKey = (params?: PaginationParams) => ['seo', params] as const;

export type SeoMeta = {
  _id: string;
  url: string;
  title: string;
  keyword: string;
  description: string;
  last_modified: string;
  change_frequency: string;
  priority: number;
  sitemap_enable: number;
  created_at: string;
  updated_at: string;
}; 

export type CreateSeoMetaPayload = {
  url: string;
  title: string;
  keyword: string;
  description: string;
  last_modified?: string;
  change_frequency: string;
  priority: number;
  sitemap_enable: number;
};

export type SeoMetasResponse = {
  success: boolean;
  data: SeoMeta[];
  message?: string;
};

/**
 * Fetch all SEO meta data from the API
 */
export const getSeoMetas = async (): Promise<SeoMeta[]> => {
  try {
    const response = await Ajax.get('admin/seo/meta');
    const seoMetas = response.data || [];
    return seoMetas.map((seo: any) => ({
      _id: seo._id,
      ...seo,
    }));
  } catch (error) {
    console.error('Error fetching SEO metas:', error);
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
 * Fetch paginated SEO metas
 */
export const getSeoMetasPaginated = async (params: PaginationParams = {}): Promise<PaginatedResponse<SeoMeta>> => {
  const { page = 1, per_page = 10 } = params;
  try {
    const response = await Ajax.get(`admin/seo/meta?page=${page}&per_page=${per_page}`);
    const rawSeoMetas = response.data || [];
    const seoMetas = rawSeoMetas.map((seo: any) => ({
      _id: seo._id,
      ...seo,
    }));
    
    return {
      data: seoMetas,
      total: response.total || rawSeoMetas.length,
      current_page: response.current_page || page,
      last_page: response.last_page || Math.ceil((response.total || rawSeoMetas.length) / per_page)
    };
  } catch (error) {
    console.error('Error fetching paginated SEO metas:', error);
    throw error;
  }
};

/**
 * Get a single SEO meta by ID
 */
export const getSeoMetaById = async (id: string): Promise<SeoMeta> => {
  const response = await Ajax.post('/admin/seo/update', { id });

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'SEO meta not found');
  }

  const seoData = response.data || response;
  return {
    _id: seoData._id || seoData.id,
    ...seoData,
  };
};

/**
 * Create a new SEO meta
 */
export const createSeoMeta = async (seoData: CreateSeoMetaPayload): Promise<any> => {
  try {
    const response = await Ajax.post('admin/seo/create', seoData);
    return response;
  } catch (error) {
    console.error('Error creating SEO meta:', error);
    throw error;
  }
};


/**
 * Update a SEO meta
 */
export const updateSeoMeta = async (id: string, seoData: any): Promise<any> => {
  try {
    seoData.append('id', id);
    const response = await Ajax.post('/admin/seo/save', seoData);
    return response;
  } catch (error) {
    console.error('Error updating SEO meta:', error);
    throw error;
  }
};


/**
 * Delete a SEO meta
 */
export const deleteSeoMeta = async (id: string): Promise<void> => {   
  try {
    await Ajax.delete(`admin/seo/${id}`);
  } catch (error) {
    console.error('Error deleting SEO meta:', error);
    throw error;
  }
};


