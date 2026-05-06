import { Ajax } from '@/helper/ajax';

export type FeatureFlags = {
  sub_categories: boolean;
  product_variants: boolean;
  bulk_stock: boolean;
  guest_checkout: boolean;
  wallet: boolean;
  coupon_system: boolean;
  sms_notifications: boolean;
  review_system: boolean;
  wishlist: boolean;
  compare_products: boolean;
  live_chat: boolean;
  invoice_download: boolean;
};

export const getFeatureToggles = async (): Promise<FeatureFlags> => {
  const res = await Ajax.get('admin/features');
  return res.data || {};
};

export const saveFeatureToggles = async (data: Partial<FeatureFlags>): Promise<void> => {
  await Ajax.post('admin/features/save', data);
};
