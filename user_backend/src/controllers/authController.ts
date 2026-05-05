import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { loginSchema } from "../validators/authValidator";
import { asyncHandler } from "../middlewares/asyncHandler";
import { TfaService } from "../services/TfaService";

interface ServiceResponse {
  http_status?: number;
  status: number;
  message: string;
  data?: any;
}

interface ApiResponse {
  status: number;
  message: string;
  data: any;
}

const formatResponse = (response: ServiceResponse): ApiResponse => ({
  status: response.status,
  message: response.message,
  data: response.data || [],
});

const OTP_TTL_MS = 5 * 60 * 1000;

export const login = asyncHandler(async (req: Request, res: Response) => {
  console.log('🔐 [LOGIN CONTROLLER] Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔐 [LOGIN CONTROLLER] IP:', req.ip);
  console.log('🔐 [LOGIN CONTROLLER] User-Agent:', req.headers['user-agent']);

  const { error } = loginSchema.validate(req.body);
  console.log("🔐 [LOGIN CONTROLLER] Validation error:", error);

  if (error) {
    console.log('🔐 [LOGIN CONTROLLER] Validation failed:', error.details[0].message);
    return res.status(400).json({
      status: 0,
      message: error.details[0].message,
      data: [],
    });
  }

  console.log('🔐 [LOGIN CONTROLLER] Calling AuthService.login...');
  const result = await AuthService.login(req);
  console.log('🔐 [LOGIN CONTROLLER] AuthService result:', JSON.stringify(result, null, 2));
  console.log('🔐 [LOGIN CONTROLLER] Sending response status:', result.http_status);

  res.status(result.http_status).json(formatResponse(result));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authToken = req.headers["auth-token"] as string;
  if (!authToken) {
    return res.status(401).json({
      status: 0,
      message: "Missing auth-token",
      data: [],
    });
  }
  const result = await AuthService.logout(authToken);
  res.status(result.http_status).json(formatResponse(result));
});

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const authToken = req.headers["auth-token"] as string;

    if (!authToken) {
      return res.status(401).json({
        status: 0,
        message: "Auth token is required",
        data: [],
      });
    }

    const result = await AuthService.refreshToken(authToken);
    res.status(result.http_status).json(formatResponse(result));
  },
);

export const loginOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.loginOtp(req);

  if (result.data && result.data.token) {
    res.setHeader("auth-token", result.data.token);
  }

  res.status(result.http_status || 200).json({
    status: result.status,
    message: result.message,
    data: result.data ?? [],
  });
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  if (req.query.type === 'tfa' || req.body.type === 'tfa') {
    if ((req as any).session && (req as any).session.device_uid) {
      (req as any).authData = {
        device_uid: (req as any).session.device_uid
      };
    } else if (req.body.device_uid) {
      (req as any).authData = {
        device_uid: req.body.device_uid
      };
    }
  }

  const result = await TfaService.verifyOtp(req);

  if (result.data && result.data.token) {
    res.setHeader("auth-token", result.data.token);
  }

  res.status(result.http_status || 200).json({
    status: result.status,
    message: result.message,
    data: result.data ?? [],
  });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await TfaService.resendOtp(req);
  res.status(result.http_status || 200).json({
    status: result.status,
    message: result.message,
    data: result.data ?? [],
  });
});

export const removeTotp = asyncHandler(async (req: Request, res: Response) => {
  const result = await TfaService.removeTotp(req);
  res.status(result.http_status || 200).json({
    status: result.status,
    message: result.message,
    data: result.data ?? [],
  });
});

export const getTotpModel = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;

    if (!userId) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized",
        data: [],
      });
    }

    const User = require("../models/userModel").default;
    const user = await User.findById(userId);
    if (user && user.totp_secret_key) {
      return res.status(403).json({
        status: 0,
        message: "TOTP already enabled",
        data: [],
      });
    }

    const result = await TfaService.generateTotpQrcode(user.email || userId);

    res.json({
      status: 1,
      message: "QR code generated successfully",
      data: {
        qrCode: result.qrCode,
        secretKey: result.secretKey,
      },
    });
  },
);

export const verifyOtpModal = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;
    const secretKey = req.query.secretKey as string;

    if (!userId) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized",
        data: [],
      });
    }

    res.json({
      status: 1,
      message: "Verify OTP modal data",
      data: {
        secretKey,
        id: userId,
      },
    });
  },
);

export const optVerifyProcess = asyncHandler(
  async (req: Request, res: Response) => {
    const { otp, secretKey, id } = req.body;

    if (!otp && req.path.includes("regenerate")) {
      const userId = req.user_id;
      if (!userId) {
        return res.status(401).json({
          status: 0,
          message: "Unauthorized",
          data: [],
        });
      }

      const result = await TfaService.regenerateBackupCode(userId);
      return res.status(result.http_status || 200).json({
        status: result.status,
        message: result.message,
        data: result.data ?? [],
      });
    }

    const result = await TfaService.optVerifyProcess(req);
    res.status(result.http_status || 200).json({
      status: result.status,
      message: result.message,
      data: result.data ?? [],
    });
  },
);

export const backupCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user_id;

  if (!userId) {
    return res.status(401).json({
      status: 0,
      message: "Unauthorized",
      data: [],
    });
  }

  const result = await TfaService.getBackupCode(userId);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.status(result.http_status || 200).json({
    status: result.status,
    message: result.message,
    data: result.data ?? [],
  });
});

export const regenerateBackupCode = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user_id;

    if (!userId) {
      return res.status(401).json({
        status: 0,
        message: "Unauthorized",
        data: [],
      });
    }

    const result = await TfaService.regenerateBackupCode(userId);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.status(result.http_status || 200).json({
      status: result.status,
      message: result.message,
      data: result.data ?? [],
    });
  },
);
