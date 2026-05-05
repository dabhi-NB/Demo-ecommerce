import { Ajax } from '@/helper/ajax';

/**
 * Get all payment gateways (admin only)
 */
export const getPaymentGateways = async () => {
  try {
    const response = await Ajax.get('admin/payment/gateways');
    return response;
  } catch (error) {
    console.error('Error fetching payment gateways:', error);
    throw error;
  }
};

/**
 * Add a new payment gateway
 */
export const addPaymentGateway = async (data: Record<string, any>) => {
  try {
    const response = await Ajax.post('admin/payment/gateways', data);
    return response;
  } catch (error) {
    console.error('Error adding payment gateway:', error);
    throw error;
  }
};

/**
 * Update a payment gateway by its ID
 * @param gatewayId - The gateway ID (e.g., 'gw_1234567890')
 */
export const updatePaymentGateway = async (gatewayId: string, data: Record<string, any>) => {
  try {
    const response = await Ajax.put(`admin/payment/gateways/${gatewayId}`, data);
    return response;
  } catch (error) {
    console.error('Error updating payment gateway:', error);
    throw error;
  }
};

/**
 * Delete a payment gateway
 * @param gatewayId - The gateway ID to delete
 */
export const deletePaymentGateway = async (gatewayId: string) => {
  try {
    const response = await Ajax.delete(`admin/payment/gateways/${gatewayId}`);
    return response;
  } catch (error) {
    console.error('Error deleting payment gateway:', error);
    throw error;
  }
};

/**
 * Update general payment settings (COD, online toggle, currency)
 */
export const updatePaymentSettings = async (data: Record<string, any>) => {
  try {
    const response = await Ajax.put('admin/payment/settings', data);
    return response;
  } catch (error) {
    console.error('Error updating payment settings:', error);
    throw error;
  }
};
