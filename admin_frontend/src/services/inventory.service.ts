import { Ajax } from '@/helper/ajax';

export const getInventoryOverview = async () => {
  const res = await Ajax.get('admin/inventory');
  return res.data;
};

export const getLowStockAlerts = async () => {
  const res = await Ajax.get('admin/inventory/alerts');
  return res.data || [];
};

export const getProductStockHistory = async (productId: string) => {
  const res = await Ajax.get(`admin/inventory/history/${productId}`);
  return res.data || [];
};
