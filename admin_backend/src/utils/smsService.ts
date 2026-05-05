import axios from 'axios';

// SMS provider types
export type SMSProvider = 'fast2sms' | 'msg91' | 'twilio' | 'custom';

export interface SendSMSParams {
  phone: string;
  message: string;
  apiKey: string;
  provider?: SMSProvider;
  senderId?: string;
}

// Default SMS templates for order status
export const SMS_TEMPLATES: Record<string, string> = {
  confirmed: `Hi {name}! Your order #{orderNum} has been confirmed. We'll notify you when it ships. - RV Mobile`,
  processing: `Hi {name}! Your order #{orderNum} is being prepared. - RV Mobile`,
  shipped: `Hi {name}! Your order #{orderNum} has been shipped! Delivery in 2-3 days. Track via app. - RV Mobile`,
  delivered: `Hi {name}! Your order #{orderNum} has been delivered. Enjoy! Rate us in the app. - RV Mobile`,
  cancelled: `Hi {name}! Your order #{orderNum} has been cancelled. Refund (if paid) in 5-7 days. - RV Mobile`,
  returned: `Hi {name}! Return for order #{orderNum} has been initiated. - RV Mobile`,
};

/**
 * Send SMS using fast2sms (default provider)
 * This is a simple implementation - can be extended for other providers
 */
export const sendSMS = async (params: SendSMSParams): Promise<boolean> => {
  const { phone, message, apiKey, provider = 'fast2sms', senderId = 'RVMOBL' } = params;

  try {
    // Validate phone number (basic Indian phone validation)
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone; // Add country code for India
    }
    if (!formattedPhone.startsWith('91') || formattedPhone.length !== 12) {
      console.error('[SMS] Invalid phone number:', phone);
      return false;
    }

    if (provider === 'fast2sms') {
      // Fast2SMS API
      const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
        params: {
          authorization: apiKey,
          message: message,
          language: 'english',
          route: 'q',
          numbers: formattedPhone,
          sender_id: senderId,
        },
        headers: {
          'Cache-Control': 'no-cache',
        },
        timeout: 10000,
      });

      if (response.data.return === true) {
        console.log('[SMS] Sent successfully to:', phone);
        return true;
      } else {
        console.error('[SMS] Failed:', response.data.message);
        return false;
      }
    } else if (provider === 'custom') {
      // Custom API - just log for now
      console.log('[SMS] Custom provider - would send to:', phone, 'Message:', message);
      return true;
    } else {
      console.error('[SMS] Unsupported provider:', provider);
      return false;
    }
  } catch (error: any) {
    console.error('[SMS Error]', error.message);
    return false;
  }
};

/**
 * Send order status SMS notification
 */
export const sendOrderStatusSMS = async (
  phone: string,
  status: string,
  orderNumber: string,
  userName: string,
  settings: { enabled: boolean; apiKey: string; provider: string }
): Promise<void> => {
  if (!settings.enabled || !settings.apiKey) {
    console.log('[SMS] SMS notifications disabled or no API key');
    return;
  }

  const template = SMS_TEMPLATES[status];
  if (!template) {
    console.log('[SMS] No template for status:', status);
    return;
  }

  const message = template
    .replace('{name}', userName)
    .replace('{orderNum}', orderNumber);

  await sendSMS({
    phone,
    message,
    apiKey: settings.apiKey,
    provider: settings.provider as SMSProvider || 'fast2sms',
  }).catch((err) => {
    console.error('[SMS Error]', err.message);
  });
};
