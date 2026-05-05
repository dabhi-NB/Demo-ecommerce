import { Ajax } from '@/helper/ajax';

export const getUserDevices = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/devices`);
  return response.data || [];
};

export const getUserActivity = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/activity`);
  return response.data || [];
};

export const getUserMails = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/mails`);
  return response.data || [];
};

export const getUserCart = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/cart`);
  return response.data || null;
};

export const getUserWishlist = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/wishlist`);
  return response.data || [];
};

export const getUserAddresses = async (userId: string) => {
  const response = await Ajax.get(`/admin/users/${userId}/addresses`);
  return response.data || [];
};

export const createUserAddress = async (userId: string, addressData: any) => {
  const response = await Ajax.post(`/admin/users/${userId}/addresses`, addressData);
  return response;
};

export const updateUserAddress = async (userId: string, addressId: string, addressData: any) => {
  const response = await Ajax.put(`/admin/users/${userId}/addresses/${addressId}`, addressData);
  return response;
};

export const deleteUserAddress = async (userId: string, addressId: string) => {
  const response = await Ajax.delete(`/admin/users/${userId}/addresses/${addressId}`);
  return response;
};

export const removeFromCart = async (userId: string, productId: string) => {
  const response = await Ajax.delete(`/admin/users/${userId}/cart/items/${productId}`);
  return response;
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const response = await Ajax.delete(`/admin/users/${userId}/wishlist/${productId}`);
  return response;
};
