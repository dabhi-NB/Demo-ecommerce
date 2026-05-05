import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema } from '../validators/authValidator';
import { asyncHandler } from '../middlewares/asyncHandler';
import { TfaService } from '../services/tfaService';
import Admin, { IUser } from '../models/adminModel';
import { encryptPassword } from '../utils/encryption';
import mongoose from "mongoose";

interface ServiceResponse {
  http_status: number;
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
  data: response.data || []
});

// User login
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate input using Joi
  const { error } = loginSchema.validate(req.body);
  console.log('Login request error:', error);

  if (error) {
    return res.status(400).json({
      status: 0,
      message: error.details[0].message,
      data: []
    });
  }

  const result = await AuthService.login(req);
  res.status(result.http_status).json(formatResponse(result));
});

// User logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const authToken = req.headers['auth-token'] as string;

  if (!authToken) {
    return res.status(401).json({
      status: 0,
      message: 'Auth token is required',
      data: []
    });
  }

  const result = await AuthService.logout(authToken);
  res.status(result.http_status).json(formatResponse(result));
});

// Refresh authentication token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const authToken = req.headers['auth-token'] as string;

  if (!authToken) {
    return res.status(401).json({
      status: 0,
      message: 'Auth token is required',
      data: []
    });
  }

  const result = await AuthService.refreshToken(authToken);
  res.status(result.http_status).json(formatResponse(result));
});


export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.json({ status: 0, message: 'Missing OTP or userId' });

  const user = await Admin.findById(userId);
  if (!user) return res.json({ status: 0, message: 'User not found' });

  const tfaService = new TfaService();
  const result = tfaService.checkOtp(otp, user.otp);

  if (result.status === 1) {
    // ✅ fix for TypeScript
    user.otp = undefined;
    user.email_verified = 1;
    await user.save();

    return res.json({
      status: 1,
      message: result.message,
      next: 'redirect',
      url: '/admin/dashboard',
    });
  }

  return res.json(result);
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({ status: 0, message: "Missing userId" });
  }

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.json({ status: 0, message: "Invalid user ID" });
  }

  const user = await Admin.findById(userId);
  if (!user) {
    return res.json({ status: 0, message: "User not found" });
  }

  // Send OTP
  const tfaService = new TfaService();
  const result = await tfaService.sendOtp(user as IUser);

  return res.json(result); // { status: 1, message: 'OTP sent successfully' }
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, userId, otp, password, password_confirm, step } = req.body;

  // Step 1: Send OTP
  if (step === 1) {
    if (!email) {
      return res.status(400).json({ status: 0, message: 'Email is required' });
    }
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(200).json({ status: 1, message: 'If this email exists, OTP has been sent' });
    }
    const tfaService = new TfaService();
    const result = await tfaService.sendOtp(user);
    return res.status(200).json({ ...result, userId: user._id });
  }

  // Step 2: Verify OTP (optional, if you want a separate step)
  if (step === 2) {
    if (!userId || !otp) {
      return res.status(400).json({ status: 0, message: 'Missing required fields' });
    }
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }
    const tfaService = new TfaService();
    const result = tfaService.checkOtp(otp, user.otp);
    if (result.status !== 1) {
      return res.status(400).json({ status: 0, message: 'Invalid or expired OTP' });
    }
    // Do NOT clear user.otp here!
    return res.status(200).json({ status: 1, message: 'OTP verified. Proceed to reset password.' });
  }

  // Resend OTP (step 2 or with resend flag)
  if ((step === 2 && req.body.resend) || req.body.resend) {
    const user = await Admin.findOne({ email }) || await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }
    const tfaService = new TfaService();
    const result = await tfaService.sendOtp(user);
    return res.status(200).json({ ...result, userId: user._id });
  }

  // Step 3: Reset password
  if (step === 3) {
    if (!userId || !password || !password_confirm) {
      return res.status(400).json({ status: 0, message: 'Missing required fields' });
    }
    if (password !== password_confirm) {
      return res.status(400).json({ status: 0, message: 'Passwords do not match' });
    }
    const user = await Admin.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }
    user.password = await encryptPassword(password);
    user.otp = undefined; // Optionally clear OTP
    await user.save();
    return res.status(200).json({ status: 1, message: 'Password reset successful' });
  }

  // Default: Invalid step
  return res.status(400).json({ status: 0, message: 'Invalid step' });
});


