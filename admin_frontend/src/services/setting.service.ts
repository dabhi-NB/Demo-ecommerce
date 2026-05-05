import { Ajax } from '@/helper/ajax';

export type SettingData = {
  [key: string]: string | number;
};

export type GeneralSettings = {
  'setting.app_name': string;
  'setting.admin_email': string;
  'setting.date_format': string;
  'setting.date_time_format': string;
  'setting.user_login_with_otp': string;
  'setting.cookie_consent': string;
  'setting.user_email_verify': string;
};

export type SmtpSettings = {
  'mail.mailers.smtp.host': string;
  'mail.mailers.smtp.encryption': 'ssl' | 'tls';
  'mail.mailers.smtp.port': string;
  'mail.mailers.smtp.username': string;
  'mail.mailers.smtp.password': string;
  'mail.from.name': string;
  'mail.from.address': string;
};

export type CaptchaSettings = {
  'setting.google_recaptcha': string;
  'setting.google_recaptcha_secret_key': string;
  'setting.google_recaptcha_public_key': string;
};

export type SocialSettings = {
  'setting.google_login': string;
  'services.google_client_id': string;
  'services.google_client_secret': string;
};

export type ContentSettings = {
  'setting.header_content': string;
  'setting.footer_content': string;
};

export type PaymentSettings = {
  'payment.payment_gateway': string;
  'payment.payment_mode': string;
  'payment.razorpay_key_id': string;
  'payment.razorpay_key_secret': string;
  'payment.stripe_publishable_key': string;
  'payment.stripe_secret_key': string;
  'payment.cashfree_app_id': string;
  'payment.cashfree_secret_key': string;
  'payment.payu_merchant_key': string;
  'payment.payu_salt': string;
  'payment.cod_enabled': string;
  'payment.online_payment_enabled': string;
};

/**
 * Get all settings (admin only)
 */
export const getSettings = async (): Promise<SettingData> => {
  try {
    const response = await Ajax.get('admin/setting/update');
    return response.data || {};
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

/**
 * Get public settings (for login, forgot password, etc.)
 */
export const getPublicSettings = async (): Promise<SettingData> => {
  try {
    const response = await Ajax.post('setting/public/get', {});
    return response.data || {};
  } catch (error) {
    console.error('Error fetching public settings:', error);
    throw error;
  }
};

/**
 * Save general settings
 */
export const saveGeneralSettings = async (data: GeneralSettings): Promise<any> => {
  try {
    const payload = {
      setting_app_name: data['setting.app_name'],
      setting_date_format: data['setting.date_format'],
      setting_date_time_format: data['setting.date_time_format'],
      setting_user_email_verify: data['setting.user_email_verify'],
      setting_user_login_with_otp: data['setting.user_login_with_otp'],
      setting_admin_email: data['setting.admin_email'],
      setting_cookie_consent: data['setting.cookie_consent'],
      type: 'general',
    };
    const response = await Ajax.post('admin/setting/save', payload);
    return response;
  } catch (error) {
    console.error('Error saving general settings:', error);
    throw error;
  }
};

/**
 * Save SMTP settings
 */
export const saveSmtpSettings = async (data: SmtpSettings): Promise<any> => {
  try {
    const payload = { ...data, type: 'smtp' };
    const response = await Ajax.post('admin/setting/save', payload);
    return response;
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
    throw error;
  }
};

/**
 * Save logo or favicon
 */
export const saveLogo = async (key: string, file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('key', key);
    formData.append('image', file);

    const response = await Ajax.post('admin/setting/save-logo', formData);
    return response;
  } catch (error) {
    console.error('Error saving logo:', error);
    throw error;
  }
};

/**
 * Save Google reCAPTCHA settings
 */
export const saveCaptchaSettings = async (data: CaptchaSettings): Promise<any> => {
  try {
    const payload = {
      setting_google_recaptcha: data['setting.google_recaptcha'],
      setting_google_recaptcha_secret_key: data['setting.google_recaptcha_secret_key'],
      setting_google_recaptcha_public_key: data['setting.google_recaptcha_public_key'],
    };
    const response = await Ajax.post('admin/setting/save-captcha', payload);
    return response;
  } catch (error) {
    console.error('Error saving captcha settings:', error);
    throw error;
  }
};

/**
 * Save social login settings
 */
export const saveSocialSettings = async (data: SocialSettings): Promise<any> => {
  try {
    const payload = {
      setting_google_login: data['setting.google_login'],
      services_google_client_id: data['services.google_client_id'],
      services_google_client_secret: data['services.google_client_secret'],
    };
    const response = await Ajax.post('admin/setting/save-social', payload);
    return response;
  } catch (error) {
    console.error('Error saving social settings:', error);
    throw error;
  }
};

/**
 * Save content settings
 */
export const saveContentSettings = async (data: ContentSettings): Promise<any> => {
  try {
    const payload = {
      setting_header_content: data['setting.header_content'],
      setting_footer_content: data['setting.footer_content'],
    };
    const response = await Ajax.post('admin/setting/save-content', payload);
    return response;
  } catch (error) {
    console.error('Error saving content settings:', error);
    throw error;
  }
};

/**
 * Clear cache
 */
export const clearCache = async (): Promise<any> => {
  try {
    const response = await Ajax.get('admin/setting/cache-clear');
    return response;
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

/**
 * Send test email
 */
export const sendTestEmail = async (email: string): Promise<any> => {
  try {
    const response = await Ajax.post('admin/setting/mail-process', { email });
    return response;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};

/**
 * Save payment settings
 */
export const savePaymentSettings = async (data: PaymentSettings): Promise<any> => {
  try {
    const payload = {
      payment_payment_gateway: data['payment.payment_gateway'],
      payment_payment_mode: data['payment.payment_mode'],
      payment_razorpay_key_id: data['payment.razorpay_key_id'],
      payment_razorpay_key_secret: data['payment.razorpay_key_secret'],
      payment_stripe_publishable_key: data['payment.stripe_publishable_key'],
      payment_stripe_secret_key: data['payment.stripe_secret_key'],
      payment_cashfree_app_id: data['payment.cashfree_app_id'],
      payment_cashfree_secret_key: data['payment.cashfree_secret_key'],
      payment_payu_merchant_key: data['payment.payu_merchant_key'],
      payment_payu_salt: data['payment.payu_salt'],
      payment_cod_enabled: data['payment.cod_enabled'],
      payment_online_payment_enabled: data['payment.online_payment_enabled'],
    };
    const response = await Ajax.post('admin/setting/save-payment', payload);
    return response;
  } catch (error) {
    console.error('Error saving payment settings:', error);
    throw error;
  }
};

export type SmsSettings = {
  'sms.fast2sms_api_key': string;
  'sms.order_placed_notification': string;
  'sms.order_shipped_notification': string;
  'sms.order_delivered_notification': string;
};

/**
 * Save SMS settings
 */
export const saveSmsSettings = async (data: SmsSettings): Promise<any> => {
  try {
    const payload = {
      sms_fast2sms_api_key: data['sms.fast2sms_api_key'],
      sms_order_placed_notification: data['sms.order_placed_notification'],
      sms_order_shipped_notification: data['sms.order_shipped_notification'],
      sms_order_delivered_notification: data['sms.order_delivered_notification'],
    };
    const response = await Ajax.post('admin/setting/save-sms', payload);
    return response;
  } catch (error) {
    console.error('Error saving SMS settings:', error);
    throw error;
  }
};
