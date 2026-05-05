import { Ajax } from '../helper/ajax';

/* ==============================
   Types / Interfaces
============================== */

export interface LoginRequest {
  email: string;
  password: string;
  device_uid: string;
  timezone: string;
}

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  image?: string;
  tfa_enabled?: boolean;
  role: number;
  permission: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  http_status?: number;
  data: {
    token: string;
    user: User;
    verifyUrl?: string;
  };
}

export interface ForgotPasswordRequest { email: string; }
export interface ForgotPasswordResponse { status: number; message: string; userId?: string; }

export interface LoginOtpRequest {
  email: string;
  step: number;
  device_uid: string;
  timezone: string;
  otp?: string;
  'g-recaptcha-response'?: string;
}
export interface LoginOtpResponse {
  status: number;
  message: string;
  data?: { token: string; user: User };
}

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  phone: string;
}
export interface UpdateProfileResponse {
  status: number;
  message: string;
  data: { user: User };
  next?: string;
  url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}
export interface ChangePasswordResponse { status: number; message: string; }

export interface UserActivityListRequest { page: number; per_page: number; }
export interface UserActivityListResponse {
  status: number;
  message: string;
  data: { activities: any[]; total: number; page: number; per_page: number };
}

export interface DeviceListRequest {

  page: number; per_page: number;
}
export interface DeviceListResponse {
  status: number;
  message: string;
  data: { devices: any[]; total: number; page: number; per_page: number };
}

export interface VerifyOtpRequest { otp: string; type: string; userId?: string; }
export interface VerifyOtpResponse { status: number; message: string; next?: string; url?: string; }

export interface RevokeAllDevicesResponse { status: number; message: string; }

export interface TFAResponse {
  status: number;
  message: string;
  data: { model: User; userAuthList: any[] };
}

export interface TFAStatusResponse {
  status: number;
  message: string;
  data: { tfa_enabled: boolean };
}

/* ==============================
   Auth Service
============================== */

export const authService = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const data = await Ajax.post('auth/login', payload);
    return data as LoginResponse;
  },

  loginOtpProcess: async (payload: LoginOtpRequest): Promise<LoginOtpResponse> => {
    const data = await Ajax.post('auth/login-otp', payload);
    return data as LoginOtpResponse;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const data = await Ajax.post('auth/forgot-password', payload);
    return data as ForgotPasswordResponse;
  },

  passwordForgotProcess: async (payload: any): Promise<any> => {
    const data = await Ajax.post('auth/forgot-password', payload);
    return data;
  },

  updateProfile: async (payload: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const data = await Ajax.put('admin/account/update', payload);
    return data as UpdateProfileResponse;
  },

  uploadImage: async (file: File, userId: string): Promise<{ status: number; message: string; data: { image: string } }> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('user_id', userId);
    const data = await Ajax.post('admin/account/upload-image', formData);
    return data as { status: number; message: string; data: { image: string } };
  },

  deleteImage: async (userId: string): Promise<{ status: number; message: string; data: { image: string } }> => {
    const data = await Ajax.delete('admin/account/delete-image', { userId });
    return data as { status: number; message: string; data: { image: string } };
  },

  changePassword: async (payload: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const data = await Ajax.post('admin/account/password-change', payload);
    return data as ChangePasswordResponse;
  },

  userActivityList: async (payload: UserActivityListRequest): Promise<UserActivityListResponse> => {
    const data = await Ajax.post('admin/account/user-activity', payload);
    return data as UserActivityListResponse;
  },

  deviceList: async (payload: DeviceListRequest): Promise<DeviceListResponse> => {
    const data = await Ajax.post('admin/account/device', payload);
    return data as DeviceListResponse;
  },

  deviceLogout: async (deviceId: string): Promise<{ status: number; message: string }> => {
    const data = await Ajax.post('admin/device/logout', { device_id: deviceId });
    return data as { status: number; message: string };
  },

  verifyOtp: async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    const data = await Ajax.post('auth/verify', payload);
    return data as VerifyOtpResponse;
  },

  resendOtp: async (payload: { userId: string }): Promise<VerifyOtpResponse> => {
    const data = await Ajax.post('auth/resend-otp', payload);
    return data as VerifyOtpResponse;
  },

  tfa: async (): Promise<TFAResponse> => {
    const data = await Ajax.post('admin/account/tfa', {});
    return data as TFAResponse;
  },

  tfastatus: async (userId: string): Promise<TFAStatusResponse> => {
    const data = await Ajax.post('admin/account/tfa-status-change', { user_id: userId });
    return data as TFAStatusResponse;
  },

  revokeAllDevices: async (): Promise<RevokeAllDevicesResponse> => {
    const data = await Ajax.post('admin/account/revoke-all', {});
    return data as RevokeAllDevicesResponse;
  },
};
