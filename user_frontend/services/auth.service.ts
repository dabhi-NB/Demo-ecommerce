import { Ajax } from "../helper/ajax";

export interface LoginRequest {
  email: string;
  password: string;
  device_uid: string;
  timezone: string;
  recaptcha_token?: string;
  remember?: number;
}

export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  image?: string;
  token?: string;
  status_tfa: boolean;
}

export interface LoginResponse {
  status: number;
  message: string;
  http_status?: number;
  data: {
    token?: string;
    user?: User;
    verifyUrl?: string;
    [key: string]: any;
  };
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  timezone: string;
}

export interface RegisterResponse {
  status: number;
  message: string;
  next?: "redirect" | "reload" | "refresh";
  url?: string;
  data?: any;
}

export interface UpdateProfileRequest {
  userId: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  image?: string;
}

export interface UpdateProfileResponse {
  status: number;
  message: string;
  data: {
    user: User;
  };
  next?: "redirect" | "reload" | "refresh"; // optional, added
  url?: string; // optional, added
}

export interface LoginOtpRequest {
  email: string;
  otp?: string;
  device_uid: string;
  timezone: string;
  recaptcha_token?: string;
}

export interface LoginOtpResponse {
  status: number;
  message: string;
  data?: {
    token: string;
    user: User;
  };
}
export interface ForgotPasswordRequest {
  email?: string;
  otp?: string;
  password?: string;
  password_confirm?: string;
  step: number;
  recaptcha_token?: string;
}
export interface ForgotPasswordResponse {
  status: number;
  message: string;
  next?: "step_2" | "step_3" | "redirect";
  url?: string;
  data?: any;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  status: number;
  message: string;
  next?: "redirect" | "reload" | "refresh";
  url?: string;
}
export interface DeleteImageResponse {
  status: number;
  message: string;
  data?: any;
}

export interface UserActivityListRequest {
  draw: number;
  start: number;
  length: number;
  search: {
    value: string;
  };
}

export interface UserActivityListResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: any[];
}

export interface DeviceListRequest {
  draw: number;
  start: number;
  length: number;
  search: {
    value: string;
  };
}

export interface DeviceListRow {
  id: string;
  client: string;
  ip: string;
  location: string;
  last_activity: string;
  action: string;
}

export interface DeviceListResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: DeviceListRow[];
}

export interface TfaStatusChangeResponse {
  status: number;
  message: string;
  next?: "refresh" | "reload";
  data?: {
    user: User;
  };
}

export interface GetQrModalResponse {
  status: number;
  message: string;
  data: {
    qrCode: string;
    secretKey: string;
  };
}

export interface BackupCodesRegenerateResponse {
  status: number;
  message: string;
  data: {
    backup_codes: string[];
  };
}

export interface RevokeAllResponse {
  status: number;
  message: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    //  console.log("API Request to /auth/login:", credentials);
    const data = await Ajax.post(`auth/login`, credentials);
    return data as LoginResponse;
  },

  register: async (credentials: RegisterRequest): Promise<RegisterResponse> => {
    const data = await Ajax.post(`register`, credentials);

    return data as RegisterResponse;
  },

  updateProfile: async (
    request: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> => {
    const data = await Ajax.put(`account/update`, request);
    return data as UpdateProfileResponse;
  },

  uploadImage: async (
    file: File,
  ): Promise<{
    status: number;
    message: string;
    data: { image: string; user: User };
  }> => {
    const formData = new FormData();
    formData.append("image", file);
    const data = await Ajax.postWithFormData(`account/update-image`, formData);
    return data;
  },
  deleteImage: async () => {
    const data = await Ajax.delete(`account/delete-image`);
    return data as { status: number; message: string; data: { image: string } };
  },
  deleteAccount: async (): Promise<{
    status: number;
    message: string;
    next?: "redirect" | "reload";
    url?: string;
  }> => {
    const data = await Ajax.post(`account/deactivate`, {}); // POST ya DELETE, jaise backend expect karta hai
    return data;
  },

  loginOtpProcess: async (
    credentials: LoginOtpRequest,
  ): Promise<LoginOtpResponse> => {
    const data = await Ajax.post(`auth/login-otp`, credentials);
    return data as LoginOtpResponse;
  },

  verifyOtp: async (payload: {
    otp: string;
    code?: string;
    type?: string;
    ignore_device?: boolean;
    device_uid?: string;
  }): Promise<{
    status: number;
    message: string;
    next?: "redirect" | "reload";
    url?: string;
    data?: {
      token?: string;
      next?: "redirect";
      url?: string;
    };
  }> => {
    const data = await Ajax.post(`auth/verify`, payload);
    return data as {
      status: number;
      message: string;
      next?: "redirect" | "reload";
      url?: string;
      data?: {
        token?: string;
        next?: "redirect";
        url?: string;
      };
    };
  },

  resendOtp: async (payload: {
    code: string;
    type: string;
  }): Promise<{ status: number; message: string }> => {
    const data = await Ajax.post(`auth/resend-otp`, payload);
    return data as {
      status: number;
      message: string;
    };
  },

  verifyAccount: async (payload: { otp: string; code: string }) => {
    const data = await Ajax.post(`auth/verify-account`, payload);
    return data as {
      status: number;
      message: string;
      next?: "redirect" | "reload";
      url?: string;
    };
  },

  forgotPassword: async (
    payload: ForgotPasswordRequest,
  ): Promise<ForgotPasswordResponse> => {
    const data = await Ajax.post(`auth/forgot-password`, payload);
    return data as ForgotPasswordResponse;
  },

  // 🔐 CHANGE PASSWORD (Laravel clone)
  changePassword: async (
    payload: ChangePasswordRequest,
  ): Promise<ChangePasswordResponse> => {
    const data = await Ajax.post("account/password-change", payload);
    return data as ChangePasswordResponse;
  },

  userActivityList: async (
    payload: UserActivityListRequest,
  ): Promise<UserActivityListResponse> => {
    const data = await Ajax.post(`account/user-activity-list`, payload);
    return data as UserActivityListResponse;
  },

  deviceList: async (
    payload: DeviceListRequest,
  ): Promise<DeviceListResponse> => {
    const data = await Ajax.post(`account/device-list`, payload);
    return data as DeviceListResponse;
  },

  deviceLogout: async (
    deviceId: string,
  ): Promise<{ status: number; message: string }> => {
    const data = await Ajax.post(`account/device-logout`, {
      device_id: deviceId,
    });
    return data as { status: number; message: string };
  },

  getPage: async (
    slug: string,
  ): Promise<{
    status: number;
    message: string;
    data: { title: string; body: string };
  }> => {
    const data = await Ajax.get(`page/${slug}`);
    return data as {
      status: number;
      message: string;
      data: { title: string; body: string };
    };
  },

  // TFA related functions
  tfaStatusChange: async (): Promise<TfaStatusChangeResponse> => {
    const data = await Ajax.post(`account/tfa-status-change`, {});
    return data as TfaStatusChangeResponse;
  },

  getQrModal: async (userId: string): Promise<GetQrModalResponse> => {
    const data = await Ajax.get(`get-qr-modal?id=${userId}`);
    return data as GetQrModalResponse;
  },

  backupCodesRegenerate: async (): Promise<BackupCodesRegenerateResponse> => {
    const data = await Ajax.get(`account/backup-codes.regenerate`);
    return data as BackupCodesRegenerateResponse;
  },

  revokeAll: async (): Promise<RevokeAllResponse> => {
    const data = await Ajax.post(`account/revoke-all`, {});
    return data as RevokeAllResponse;
  },

  getTfaStatus: async (): Promise<{
    status: number;
    message: string;
    data: { status_tfa: boolean; userAuthList: any[] };
  }> => {
    const data = await Ajax.get(`account/tfa`);
    return data as {
      status: number;
      message: string;
      data: { status_tfa: boolean; userAuthList: any[] };
    };
  },

  optVerifyProcess: async (payload: {
    otp: string;
    id: string;
    secretKey?: string;
  }): Promise<{
    status: number;
    message: string;
    next?: "refresh" | "reload";
  }> => {
    const data = await Ajax.post(`otp.confirm`, payload);
    return data as {
      status: number;
      message: string;
      next?: "refresh" | "reload";
    };
  },

  verifyOtpModal: async (
    secretKey?: string,
  ): Promise<{
    status: number;
    message: string;
    data: {
      secretKey: string;
      id: string;
    };
  }> => {
    const url = secretKey
      ? `otp.verify?secretKey=${encodeURIComponent(secretKey)}`
      : `otp.verify`;
    const data = await Ajax.get(url);
    return data as {
      status: number;
      message: string;
      data: {
        secretKey: string;
        id: string;
      };
    };
  },

  backupCode: async (): Promise<{
    status: number;
    message: string;
    data: {
      backupCode: string;
      user: User;
    };
  }> => {
    const data = await Ajax.get(`account/backup-code`);
    return data as {
      status: number;
      message: string;
      data: {
        backupCode: string;
        user: User;
      };
    };
  },

  getTotpModel: async (): Promise<{
    status: number;
    message: string;
    data: {
      qrCode: string;
      secretKey: string;
    };
  }> => {
    const data = await Ajax.get(`copy-secret-key`);
    return data as {
      status: number;
      message: string;
      data: {
        qrCode: string;
        secretKey: string;
      };
    };
  },

  removeTotp: async (): Promise<{
    status: number;
    message: string;
  }> => {
    const data = await Ajax.post(`remove-totp`, {});
    return data as {
      status: number;
      message: string;
    };
  },
};
