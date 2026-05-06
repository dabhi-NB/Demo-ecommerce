import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/asyncHandler';
import {
  getAllSettings,
  getSetting,
  updateSetting,
} from '../utils/settings';
import { deleteFile } from '../utils/fileUpload';
import { GeneralHelper } from '../utils/general';
import { clearAllCache } from '../utils/cache';
import Setting from '../models/settingModel';
import { PaymentGatewayConfig, GATEWAY_META } from '../types/paymentTypes';

export const getPublicSettings = asyncHandler(async (_req: Request, res: Response) => {
  const publicSettings = {
    'setting.app_name': await getSetting('setting.app_name'),
    'setting.app_logo': await getSetting('setting.app_logo'),
    'setting.app_favicon': await getSetting('setting.app_favicon'),
    'setting.google_recaptcha': await getSetting('setting.google_recaptcha'),
    'setting.google_recaptcha_public_key': await getSetting('setting.google_recaptcha_public_key'),
    'setting.cookie_consent': await getSetting('setting.cookie_consent'),
    // Payment settings (public-facing)
    'payment.payment_gateway': await getSetting('payment.payment_gateway'),
    'payment.payment_mode': await getSetting('payment.payment_mode'),
    'payment.online_payment_enabled': await getSetting('payment.online_payment_enabled'),
    'payment.cod_enabled': await getSetting('payment.cod_enabled'),
  };

  return res.status(200).json({
    status: 1,
    message: 'Public settings fetched successfully',
    data: publicSettings,
  });
});


export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getAllSettings();

  // Security: Never return secret keys - return empty string instead
  const secretKeys = [
    'payment.razorpay_key_secret',
    'payment.stripe_secret_key',
    'payment.cashfree_secret_key',
    'payment.payu_salt',
    'sms.fast2sms_api_key',
    'sms.api_key',
  ];

  const result = { ...settings };
  for (const key of secretKeys) {
    if (result[key] !== undefined) {
      result[key] = '';
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Settings fetched successfully',
    data: result,
  });
});


export const saveSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    setting_app_name,
    setting_date_format,
    setting_date_time_format,
    setting_user_email_verify,
    setting_user_login_with_otp,
    setting_admin_email,
    setting_cookie_consent,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'setting.app_name': setting_app_name,
    'setting.date_format': setting_date_format,
    'setting.date_time_format': setting_date_time_format,
    'setting.user_email_verify': setting_user_email_verify,
    'setting.user_login_with_otp': setting_user_login_with_otp,
    'setting.admin_email': setting_admin_email,
    'setting.cookie_consent': setting_cookie_consent,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'General settings saved successfully',
  });
});


export const saveLogo = asyncHandler(async (req: any, res: Response) => {
  let { key } = req.body;

  if (!key) {
    return res.status(400).json({ status: 0, message: 'Key is required' });
  }

  key = key.replace(/^setting\./, '');

  if (!['app_logo', 'app_favicon'].includes(key)) {
    return res.status(400).json({ status: 0, message: 'Invalid key' });
  }

  if (!req.file) {
    return res.status(400).json({ status: 0, message: 'File is required' });
  }

  const newFileName = req.file.filename;

  // Delete old file if exists and is different
  const oldFileName = await getSetting(`setting.${key}`);
  if (oldFileName && String(oldFileName) !== newFileName) {
    deleteFile('setting', String(oldFileName));
  }

  // Save new file in DB
  await updateSetting(`setting.${key}`, newFileName, 0);

  return res.status(200).json({
    success: true, // frontend relies on this
    status: 1,
    message: key === 'app_logo' ? 'App logo updated successfully' : 'Favicon updated successfully',
    data: {
      key: `setting.${key}`,
      value: newFileName,
    },
  });
});


export const mailProcess = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(422).json({
        status: 0,
        message: 'Valid email is required',
      });
    }

    const subject = 'Email Test';
    const body = '<p>This is a test email.</p>';

    const result = await GeneralHelper.sendEmailSMTP(
      email,
      subject,
      body
    );

    if (result.status === 0) {
      return res.status(500).json({
        status: 0,
        message: result.message,
      });
    }

    return res.status(200).json({
      status: 1,
      message: 'Email Sent Successfully',
    });
  }
);


export const saveCaptchaSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    setting_google_recaptcha,
    setting_google_recaptcha_secret_key,
    setting_google_recaptcha_public_key,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'setting.google_recaptcha': setting_google_recaptcha,
    'setting.google_recaptcha_secret_key': setting_google_recaptcha_secret_key,
    'setting.google_recaptcha_public_key': setting_google_recaptcha_public_key,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Captcha settings saved successfully',
  });
});

export const saveSocialSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    setting_google_login,
    services_google_client_id,
    services_google_client_secret,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'setting.google_login': setting_google_login,
    'services.google_client_id': services_google_client_id,
    'services.google_client_secret': services_google_client_secret,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Social settings saved successfully',
  });
});

export const saveContentSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    setting_header_content,
    setting_footer_content,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'setting.header_content': setting_header_content,
    'setting.footer_content': setting_footer_content,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Content settings saved successfully',
  });
});

export const cacheClear = asyncHandler(
  async (_req: Request, res: Response) => {
    await clearAllCache();

    return res.status(200).json({
      status: 1,
      message: 'Cache cleared successfully',
    });
  }
);

export const savePaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    payment_payment_gateway,
    payment_payment_mode,
    payment_razorpay_key_id,
    payment_razorpay_key_secret,
    payment_stripe_publishable_key,
    payment_stripe_secret_key,
    payment_cashfree_app_id,
    payment_cashfree_secret_key,
    payment_payu_merchant_key,
    payment_payu_salt,
    payment_cod_enabled,
    payment_online_payment_enabled,
  } = req.body;

  // Public/non-secret settings - update normally
  const settingsMap: Record<string, any> = {
    'payment.payment_gateway': payment_payment_gateway,
    'payment.payment_mode': payment_payment_mode,
    'payment.razorpay_key_id': payment_razorpay_key_id,
    'payment.stripe_publishable_key': payment_stripe_publishable_key,
    'payment.cashfree_app_id': payment_cashfree_app_id,
    'payment.payu_merchant_key': payment_payu_merchant_key,
    'payment.cod_enabled': payment_cod_enabled,
    'payment.online_payment_enabled': payment_online_payment_enabled,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  // Secret keys - only update if non-empty string received
  if (payment_razorpay_key_secret && payment_razorpay_key_secret.trim() !== '') {
    await updateSetting('payment.razorpay_key_secret', payment_razorpay_key_secret, 0);
  }
  if (payment_stripe_secret_key && payment_stripe_secret_key.trim() !== '') {
    await updateSetting('payment.stripe_secret_key', payment_stripe_secret_key, 0);
  }
  if (payment_cashfree_secret_key && payment_cashfree_secret_key.trim() !== '') {
    await updateSetting('payment.cashfree_secret_key', payment_cashfree_secret_key, 0);
  }
  if (payment_payu_salt && payment_payu_salt.trim() !== '') {
    await updateSetting('payment.payu_salt', payment_payu_salt, 0);
  }

  return res.status(200).json({
    status: 1,
    message: 'Payment settings saved successfully',
  });
});

export const saveSmsSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    sms_provider,
    sms_api_key,
    sms_fast2sms_api_key,
    sms_order_placed_notification,
    sms_order_shipped_notification,
    sms_order_delivered_notification,
    sms_order_notifications,
  } = req.body;

  // Public/non-secret settings - update normally
  const settingsMap: Record<string, any> = {
    'sms.provider': sms_provider,
    'sms.order_placed_notification': sms_order_placed_notification,
    'sms.order_shipped_notification': sms_order_shipped_notification,
    'sms.order_delivered_notification': sms_order_delivered_notification,
    'sms.order_notifications': sms_order_notifications,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  // Secret keys - only update if non-empty string received
  if (sms_api_key && sms_api_key.trim() !== '') {
    await updateSetting('sms.api_key', sms_api_key, 0);
  }
  if (sms_fast2sms_api_key && sms_fast2sms_api_key.trim() !== '') {
    await updateSetting('sms.fast2sms_api_key', sms_fast2sms_api_key, 0);
  }

  return res.status(200).json({
    status: 1,
    message: 'SMS settings saved successfully',
  });
});

// ── GET PAYMENT GATEWAYS (Admin) ──
export const getPaymentGateways = asyncHandler(async (_req: any, res: any) => {
  const setting = await Setting.findOne({ key: 'payment_gateways' });
  const settings = await Setting.find({
    key: { $in: ['cod_enabled', 'online_payment_enabled', 'payment_currency', 'payment_order_min'] },
  });

  let gateways: PaymentGatewayConfig[] = [];
  if (setting?.value) {
    try {
      gateways = JSON.parse(setting.value);
    } catch {
      gateways = [];
    }
  }

  // NEVER return secret credentials in GET
  const sanitized = gateways.map((gw) => ({
    ...gw,
    credentials: {
      keyId: gw.credentials.keyId || '',
      // keySecret: NEVER return
      // webhookSecret: NEVER return
    },
  }));

  const meta: Record<string, string> = {};
  settings.forEach((s: any) => {
    meta[s.key] = s.value;
  });

  return res.status(200).json({
    success: true,
    data: {
      gateways: sanitized,
      codEnabled: meta['cod_enabled'] === 'true',
      onlinePaymentEnabled: meta['online_payment_enabled'] === 'true',
      currency: meta['payment_currency'] || 'INR',
      orderAmountMin: parseInt(meta['payment_order_min'] || '0'),
      gatewayMeta: GATEWAY_META, // send to frontend so it knows what fields each gateway needs
    },
  });
});

// ── ADD PAYMENT GATEWAY ──
export const addPaymentGateway = asyncHandler(async (req: any, res: any) => {
  const {
    type,
    displayName,
    mode,
    isActive,
    isDefault,
    supportedMethods,
    userDisplayConfig,
    credentials,
  } = req.body;

  if (!type || !displayName) {
    return res.status(400).json({ success: false, message: 'type and displayName are required' });
  }

  const newGateway: PaymentGatewayConfig = {
    id: 'gw_' + Date.now(),
    type,
    displayName,
    mode: mode || 'test',
    isActive: isActive ?? false,
    isDefault: false,
    supportedMethods: supportedMethods || [],
    userDisplayConfig: userDisplayConfig || { label: displayName, description: '' },
    credentials: {
      keyId: credentials?.keyId || '',
      keySecret: credentials?.keySecret || '', // store as-is (encrypt if encryption util exists)
      webhookSecret: credentials?.webhookSecret || '',
      ...Object.fromEntries(
        Object.entries(credentials || {}).filter(([k]) => !['keyId', 'keySecret', 'webhookSecret'].includes(k))
      ),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existingSetting = await Setting.findOne({ key: 'payment_gateways' });
  let gateways: PaymentGatewayConfig[] = [];
  if (existingSetting?.value) {
    try {
      gateways = JSON.parse(existingSetting.value);
    } catch { }
  }

  // If isDefault, unset others
  if (isDefault) {
    gateways = gateways.map((gw) => ({ ...gw, isDefault: false }));
  }
  gateways.push(newGateway);

  await Setting.findOneAndUpdate({ key: 'payment_gateways' }, { value: JSON.stringify(gateways) }, { upsert: true });

  return res.status(201).json({ success: true, message: 'Gateway added', data: { id: newGateway.id } });
});

// ── UPDATE PAYMENT GATEWAY ──
export const updatePaymentGateway = asyncHandler(async (req: any, res: any) => {
  const { gatewayId } = req.params;
  const updates = req.body;

  const existingSetting = await Setting.findOne({ key: 'payment_gateways' });
  let gateways: PaymentGatewayConfig[] = [];
  if (existingSetting?.value) {
    try {
      gateways = JSON.parse(existingSetting.value);
    } catch { }
  }

  const idx = gateways.findIndex((gw) => gw.id === gatewayId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Gateway not found' });
  }

  // If isDefault, unset others
  if (updates.isDefault) {
    gateways = gateways.map((gw) => ({ ...gw, isDefault: false }));
  }

  // Update credentials: only overwrite if non-empty string sent
  const updatedCredentials = { ...gateways[idx].credentials };
  if (updates.credentials) {
    if (updates.credentials.keyId !== undefined) {
      updatedCredentials.keyId = updates.credentials.keyId;
    }
    if (updates.credentials.keySecret && updates.credentials.keySecret.trim() !== '') {
      updatedCredentials.keySecret = updates.credentials.keySecret; // only update if non-empty
    }
    if (updates.credentials.webhookSecret && updates.credentials.webhookSecret.trim() !== '') {
      updatedCredentials.webhookSecret = updates.credentials.webhookSecret;
    }
    // Handle extra fields (e.g. saltIndex for PhonePe)
    Object.entries(updates.credentials).forEach(([k, v]) => {
      if (!['keyId', 'keySecret', 'webhookSecret'].includes(k) && v !== undefined) {
        updatedCredentials[k] = v as string;
      }
    });
  }

  gateways[idx] = {
    ...gateways[idx],
    ...(updates.displayName !== undefined && { displayName: updates.displayName }),
    ...(updates.mode !== undefined && { mode: updates.mode }),
    ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
    ...(updates.supportedMethods !== undefined && { supportedMethods: updates.supportedMethods }),
    ...(updates.userDisplayConfig !== undefined && {
      userDisplayConfig: { ...gateways[idx].userDisplayConfig, ...updates.userDisplayConfig },
    }),
    credentials: updatedCredentials,
    updatedAt: new Date().toISOString(),
  };

  await Setting.findOneAndUpdate({ key: 'payment_gateways' }, { value: JSON.stringify(gateways) }, { upsert: true });

  return res.status(200).json({ success: true, message: 'Gateway updated' });
});

// ── DELETE PAYMENT GATEWAY ──
export const deletePaymentGateway = asyncHandler(async (req: any, res: any) => {
  const { gatewayId } = req.params;

  const existingSetting = await Setting.findOne({ key: 'payment_gateways' });
  let gateways: PaymentGatewayConfig[] = [];
  if (existingSetting?.value) {
    try {
      gateways = JSON.parse(existingSetting.value);
    } catch { }
  }

  const idx = gateways.findIndex((gw) => gw.id === gatewayId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Gateway not found' });
  }

  gateways.splice(idx, 1);

  await Setting.findOneAndUpdate({ key: 'payment_gateways' }, { value: JSON.stringify(gateways) }, { upsert: true });

  return res.status(200).json({ success: true, message: 'Gateway deleted' });
});

// ── UPDATE GENERAL PAYMENT SETTINGS ──
export const updatePaymentSettings = asyncHandler(async (req: any, res: any) => {
  const { codEnabled, onlinePaymentEnabled, currency, orderAmountMin } = req.body;

  const updates = [
    { key: 'cod_enabled', value: String(codEnabled ?? true) },
    { key: 'online_payment_enabled', value: String(onlinePaymentEnabled ?? false) },
    { key: 'payment_currency', value: currency || 'INR' },
    { key: 'payment_order_min', value: String(orderAmountMin ?? 0) },
  ];

  await Promise.all(
    updates.map(({ key, value }) => Setting.findOneAndUpdate({ key }, { value }, { upsert: true }))
  );

  return res.status(200).json({ success: true, message: 'Payment settings updated' });
});


// ── SAVE THEME SETTINGS ──
export const saveThemeSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    theme_primary_color,
    theme_secondary_color,
    theme_font,
    theme_dark_mode,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'theme.primary_color': theme_primary_color,
    'theme.secondary_color': theme_secondary_color,
    'theme.font': theme_font,
    'theme.dark_mode': theme_dark_mode,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Theme settings saved successfully',
  });
});


// ── SAVE STORE SETTINGS ──
export const saveStoreSettings = asyncHandler(async (req: Request, res: Response) => {
  const {
    store_type,
    store_currency,
    store_currency_symbol,
  } = req.body;

  const settingsMap: Record<string, any> = {
    'store.type': store_type,
    'store.currency': store_currency,
    'store.currency_symbol': store_currency_symbol,
  };

  for (const [key, value] of Object.entries(settingsMap)) {
    if (value !== undefined) {
      await updateSetting(key, String(value), 0);
    }
  }

  return res.status(200).json({
    status: 1,
    message: 'Store settings saved successfully',
  });
});