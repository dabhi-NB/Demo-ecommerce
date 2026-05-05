export type GatewayType = 'razorpay' | 'stripe' | 'cashfree' | 'payu' | 'phonepe' | 'ccavenue' | 'custom';

export interface PaymentGatewayConfig {
  id: string;               // unique identifier, auto-generated (e.g. 'gw_1234567890')
  type: GatewayType;        // which gateway library to use
  displayName: string;      // admin-set name: "Razorpay India", "Stripe USD", etc.
  isActive: boolean;        // admin can toggle on/off
  isDefault: boolean;       // which one to show first on user side
  supportedMethods: string[]; // ['upi', 'card', 'netbanking', 'wallet', 'cod']
  
  // Key-value pairs for credentials — gateway-specific
  // Stored encrypted (use existing encryption utility if available)
  credentials: {
    keyId?: string;           // Razorpay: key_id, Stripe: publishable_key, Cashfree: app_id, PayU: merchant_key
    keySecret?: string;       // NEVER returned in GET — write-only
    webhookSecret?: string;   // NEVER returned in GET
    [key: string]: string | undefined;  // allow any additional keys
  }
  
  // Display config for user side
  userDisplayConfig: {
    label: string;          // "Pay with Razorpay", "International Card"
    description: string;    // "UPI, Cards, Netbanking via Razorpay"
    iconUrl?: string;       // optional logo URL
  }
  
  // Mode
  mode: 'test' | 'live';
  
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  gateways: PaymentGatewayConfig[];
  codEnabled: boolean;
  codLabel: string;              // "Cash on Delivery" or custom text
  onlinePaymentEnabled: boolean; // master toggle
  currency: string;              // 'INR', 'USD', etc.
  orderAmountMin: number;        // min order for online payment
}

// Gateway metadata — what fields each gateway needs
export const GATEWAY_META: Record<GatewayType, {
  label: string;
  fields: { key: string; label: string; isSecret: boolean; placeholder: string }[];
  supportedMethods: string[];
  docs: string;
}> = {
  razorpay: {
    label: 'Razorpay',
    fields: [
      { key: 'keyId', label: 'Key ID', isSecret: false, placeholder: 'rzp_test_...' },
      { key: 'keySecret', label: 'Key Secret', isSecret: true, placeholder: 'Enter to set/update' },
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', isSecret: true, placeholder: 'Enter to set/update' },
    ],
    supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    docs: 'https://razorpay.com/docs/payment-gateway/web-integration/',
  },
  stripe: {
    label: 'Stripe',
    fields: [
      { key: 'keyId', label: 'Publishable Key', isSecret: false, placeholder: 'pk_test_...' },
      { key: 'keySecret', label: 'Secret Key', isSecret: true, placeholder: 'Enter to set/update' },
      { key: 'webhookSecret', label: 'Webhook Secret (optional)', isSecret: true, placeholder: 'whsec_...' },
    ],
    supportedMethods: ['card', 'upi', 'netbanking'],
    docs: 'https://stripe.com/docs/keys',
  },
  cashfree: {
    label: 'Cashfree',
    fields: [
      { key: 'keyId', label: 'App ID', isSecret: false, placeholder: 'TEST...' },
      { key: 'keySecret', label: 'Secret Key', isSecret: true, placeholder: 'Enter to set/update' },
    ],
    supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    docs: 'https://docs.cashfree.com/',
  },
  payu: {
    label: 'PayU',
    fields: [
      { key: 'keyId', label: 'Merchant Key', isSecret: false, placeholder: 'Your merchant key' },
      { key: 'keySecret', label: 'Salt', isSecret: true, placeholder: 'Enter to set/update' },
    ],
    supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    docs: 'https://devguide.payu.in/',
  },
  phonepe: {
    label: 'PhonePe',
    fields: [
      { key: 'keyId', label: 'Merchant ID', isSecret: false, placeholder: 'PGTESTPAYUAT...' },
      { key: 'keySecret', label: 'Salt Key', isSecret: true, placeholder: 'Enter to set/update' },
      { key: 'saltIndex', label: 'Salt Index', isSecret: false, placeholder: '1' },
    ],
    supportedMethods: ['upi', 'card', 'wallet'],
    docs: 'https://developer.phonepe.com/v1/reference/',
  },
  ccavenue: {
    label: 'CCAvenue',
    fields: [
      { key: 'keyId', label: 'Merchant ID', isSecret: false, placeholder: 'Your merchant ID' },
      { key: 'keySecret', label: 'Working Key', isSecret: true, placeholder: 'Enter to set/update' },
      { key: 'accessCode', label: 'Access Code', isSecret: false, placeholder: 'Your access code' },
    ],
    supportedMethods: ['card', 'netbanking', 'upi', 'wallet'],
    docs: 'https://www.ccavenue.com/api/',
  },
  custom: {
    label: 'Custom Gateway',
    fields: [
      { key: 'keyId', label: 'API Key / Key ID', isSecret: false, placeholder: 'Your key ID' },
      { key: 'keySecret', label: 'API Secret', isSecret: true, placeholder: 'Enter to set/update' },
      { key: 'apiUrl', label: 'API Base URL', isSecret: false, placeholder: 'https://api.yourgateway.com' },
    ],
    supportedMethods: ['card'],
    docs: '',
  },
};
