import { Request, Response } from "express";
import mongoose from "mongoose";
import Admin, { IUser } from "../models/adminModel";
import { asyncHandler } from "../middlewares/asyncHandler";
import { profileValidationSchema } from "../validators/profileValidator";
import { TfaService } from "../services/tfaService";
import { encryptPassword, checkPassword } from "../utils/encryption";
import { GeneralHelper } from "../utils/general";

// Extend Request type to include userData
export interface AuthRequest extends Request {
  userData?: IUser;
}

// ---------------------
// Update Profile
// ---------------------
export const updateProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { error, value } = profileValidationSchema.validate(req.body, {
      abortEarly: true,
      allowUnknown: true,
    });

    if (error) return res.json({ status: 0, message: error.details[0].message });

    const { first_name, last_name, phone, email } = value;
    const user = req.userData;
    if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

    const dbUser = await Admin.findById(user._id);
    if (!dbUser) return res.json({ status: 0, message: "User not found" });

    // Detect changes
    const phoneChanged = phone !== dbUser.phone;
    const emailChanged = email !== dbUser.email;

    // Update values
    dbUser.first_name = first_name;
    dbUser.last_name = last_name;
    if (phoneChanged) dbUser.phone = phone;
    if (emailChanged) {
      dbUser.email = email;
      dbUser.email_verified = 0; // reset verification
    }

    await dbUser.save();

    // Send OTP if email/phone changed
    if (phoneChanged || emailChanged) {
      const tfaService = new TfaService();
      await tfaService.sendOtp(dbUser as IUser);

      return res.json({
        status: 1,
        message: "Account Updated Successfully",
        next: "redirect",
        url: "auth/verify?type=email",
      });
    }

    return res.json({
      status: 1,
      message: "Account Updated Successfully",
      next: "reload",
    });
  }
);

// ---------------------
// Update Profile Image
// ---------------------
export const updateImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.userData;
  if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

  const dbUser = await Admin.findById(user._id);
  if (!dbUser) return res.json({ status: 0, message: "User not found" });

  if (!req.file) return res.json({ status: 0, message: "No image uploaded" });

  // Delete old image if exists
  if (dbUser.image) {
    const { deleteFile } = await import('../utils/fileUpload');
    deleteFile('profile', dbUser.image);
  }

  dbUser.image = req.file.filename;
  await dbUser.save();

  return res.json({
    status: 1,
    message: "Image updated successfully",
    data: { image: dbUser.image, user: dbUser },
  });
});

// ---------------------
// Delete Profile Image
// ---------------------
export const deleteImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.userData;
  if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

  const dbUser = await Admin.findById(user._id);
  if (!dbUser) return res.json({ status: 0, message: "User not found" });
  if (!dbUser.image) return res.json({ status: 0, message: "Image not found" });

  await GeneralHelper.deleteFile(dbUser.image, "profile");
  dbUser.image = undefined;
  await dbUser.save();

  return res.json({ status: 1, message: "Image deleted successfully", next: "reload" });
});

// ---------------------
// Get Profile
// ---------------------
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.userData;
  if (!user) return res.status(401).json({ status: 0, message: "Unauthorized" });

  const dbUser = await Admin.findById(user._id).select(
    "-password -totp_secret_key -totp_backup_code"
  );
  if (!dbUser) return res.json({ status: 0, message: "User not found" });

  return res.json({ status: 1, data: dbUser });
});

// ---------------------
// Change Password
// ---------------------
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const user = (global as any).userData;
  if (!user) return res.status(401).json({ status: 0, message: 'User not authenticated' });

  const { current_password, new_password, confirm_password } = req.body;
  if (!current_password || !new_password || !confirm_password)
    return res.json({ status: 0, message: 'All fields are required' });

  if (new_password !== confirm_password)
    return res.json({ status: 0, message: 'Passwords do not match' });

  const isValid = await checkPassword(current_password, user.password);
  if (!isValid) return res.json({ status: 0, message: 'Old password is incorrect' });

  const hashedPassword = await encryptPassword(new_password);
  await Admin.findByIdAndUpdate(user._id, { password: hashedPassword });

  return res.json({ status: 1, message: 'Password changed successfully' });
});

// ---------------------
// Toggle TFA Status
// ---------------------
export const toggleTfaStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userData = req.userData;
  if (!userData) {
    return res.status(401).json({ status: 0, message: 'Unauthorized', data: { tfa_enabled: false } });
  }

  const admin = await Admin.findById(userData._id);
  if (!admin) {
    return res.status(404).json({ status: 0, message: 'Admin not found', data: { tfa_enabled: false } });
  }

  admin.status_tfa = admin.status_tfa === 1 ? 0 : 1;
  await admin.save();

  return res.json({
    status: 1,
    message: admin.status_tfa === 1
      ? 'Two-Factor Authentication enabled'
      : 'Two-Factor Authentication disabled',
    data: { tfa_enabled: admin.status_tfa === 1 }
  });
});


// ---------------------
// Revoke All Devices
// ---------------------
export const revokeAllDevices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.userData;
  if (!user) {
    return res.status(401).json({ status: 0, message: 'Unauthorized' });
  }

  const result = await TfaService.revokeAll2FADevices(user._id.toString());

  return res.json({
    status: result.status,
    message: result.message,
    next: "reload"
  });
});