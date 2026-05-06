import { Ajax } from '@/helper/ajax';

export interface NavItem {
  _id: string;
  label: string;
  url: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  openInNewTab: boolean;
  parent: string | null;
  location: 'header' | 'footer' | 'sidebar';
  visibleTo: 'all' | 'guest' | 'user';
}

export const getNavItems = async (): Promise<NavItem[]> => {
  const res = await Ajax.get('admin/nav');
  return res.data || [];
};

export const getNavById = async (id: string): Promise<NavItem> => {
  const res = await Ajax.get(`admin/nav/${id}`);
  return res.data;
};

export const createNavItem = async (data: Partial<NavItem>): Promise<NavItem> => {
  const res = await Ajax.post('admin/nav/create', data);
  return res.data;
};

export const updateNavItem = async (id: string, data: Partial<NavItem>): Promise<NavItem> => {
  const res = await Ajax.put(`admin/nav/${id}`, data);
  return res.data;
};

export const deleteNavItem = async (id: string): Promise<void> => {
  await Ajax.delete(`admin/nav/${id}`);
};

export const reorderNavItems = async (items: Array<{ id: string; order: number }>): Promise<void> => {
  await Ajax.post('admin/nav/reorder', { items });
};
