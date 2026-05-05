import { Ajax } from '@/helper/ajax';

export type Page = {
  _id: string;
  slug: string;
  title: string;
  body: string;
};

export const getPages = async (): Promise<Page[]> => {
  const response = await Ajax.get('admin/pages');
  return response.data || [];
};

export const getPageById = async (id: string): Promise<Page> => {
  const response = await Ajax.post('/admin/page/update', { id });

  if (!response || response.status !== 1) {
    throw new Error(response?.message || 'Page not found');
  }
  const page = response.data || response;
  return {
    _id: page._id || page.id,
    ...page,
  };
};

export const updatePage = async (id: string, pageData: Partial<Page>): Promise<any> => {
  const response = await Ajax.post('/admin/page/save', { id, ...pageData });
  return response;
  
}


