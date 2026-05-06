import api from './api';

export interface PaymentInitiateResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderId: string;
  orderNumber: string;
}

export interface PaymentVerifyPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  orderId: string;
}

/**
 * Initiate Razorpay payment for an order
 */
export const initiatePayment = async (orderId: string): Promise<PaymentInitiateResponse> => {
  const res = await api.post('/payment/initiate', { orderId });
  return res.data.data;
};

/**
 * Verify payment after Razorpay callback
 */
export const verifyPayment = async (payload: PaymentVerifyPayload): Promise<any> => {
  const res = await api.post('/payment/verify', payload);
  return res.data;
};

/**
 * Get payment status for an order
 */
export const getPaymentStatus = async (orderId: string): Promise<any> => {
  const res = await api.get(`/payment/status/${orderId}`);
  return res.data.data;
};

/**
 * Open Razorpay checkout widget
 * Call initiatePayment first, then pass the result here
 */
export const openRazorpayCheckout = (
  paymentData: PaymentInitiateResponse,
  userInfo: { name: string; email: string; phone?: string },
  onSuccess: (response: any) => void,
  onFailure?: (error: any) => void
): void => {
  if (typeof window === 'undefined' || !(window as any).Razorpay) {
    console.error('Razorpay SDK not loaded. Add <script src="https://checkout.razorpay.com/v1/checkout.js"> to your HTML');
    return;
  }

  const options = {
    key: paymentData.keyId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    name: 'Demo Store',
    description: `Order #${paymentData.orderNumber}`,
    order_id: paymentData.razorpayOrderId,
    prefill: {
      name: userInfo.name,
      email: userInfo.email,
      contact: userInfo.phone || '',
    },
    theme: { color: '#6366f1' },
    handler: (response: any) => {
      onSuccess(response);
    },
    modal: {
      ondismiss: () => {
        if (onFailure) onFailure({ message: 'Payment cancelled by user' });
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.on('payment.failed', (response: any) => {
    if (onFailure) onFailure(response.error);
  });
  rzp.open();
};
