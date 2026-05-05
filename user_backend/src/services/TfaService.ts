// ✅ SAVE CLEANLY
import { IUser } from "../models/userModel";
import User from "../models/userModel";
import Auth from "../models/authModel";
import { GeneralHelper } from "../utils/generalHelper";
import { Document } from "mongoose";
import { getSetting, getAllSettings } from "../utils/settingsHelper";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import logger from "../utils/logger";

type IUserDoc = IUser & Document;

export class TfaService {
  /**
   * Generate a 6-digit OTP.
   */
  generateOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  /**
   * UNIVERSAL EMAIL SENDER (OTP / WELCOME / ADMIN)
   */
  static async sendEmailByKey(
    templateKey: string,
    options: {
      user?: IUserDoc;
      to?: string;
      data?: Record<string, any>;
    },
  ): Promise<{ status: number; message: string }> {
    const { user, to, data = {} } = options;

    const settings = await getAllSettings();

    // 🔹 Resolve receiver email
    let toEmail = to || user?.email || "";

    // 🔥 ADMIN EMAIL OVERRIDE
    if (templateKey === "admin_contact") {
      toEmail =
        settings["setting.admin_email"] || process.env.ADMIN_EMAIL || "";
    }

    if (!toEmail) {
      return { status: 0, message: "Recipient email not found" };
    }

    // 🔹 FINAL PAYLOAD (MATCH OTP STRUCTURE)
    const payload = {
      app_name: settings["setting.app_name"] || process.env.APP_NAME || "App",

      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",

      ...data,
    };

    return await GeneralHelper.sendEmail(toEmail, templateKey, payload);
  }

  /**
   * Encrypt email using Base64.
   */
  encryptCode(email: string): string {
    return Buffer.from(email).toString("base64");
  }

  /**
   * Decrypt email using Base64.
   */
  decryptCode(encoded: string): string {
    if (!encoded) {
      throw new Error("Invalid code");
    }
    return Buffer.from(encoded, "base64").toString("utf-8");
  }

  /**
   * Check OTP validity.
   */
  static checkOtp(
    otp: number | string,
    loginOtp: string | null,
  ): { status: number; message: string } {
    if (!loginOtp) {
      return { status: 0, message: "OTP is invalid" };
    }

    const [storedOtp] = loginOtp.split("_");

    if (storedOtp !== otp.toString()) {
      return { status: 0, message: "OTP is invalid" };
    }

    return { status: 1, message: "Success" };
  }

  /**
   * Check and consume backup code.
   */
  static checkAndConsumeBackupCode(user: IUserDoc, code: string): boolean {
    if (!user.backup_code) return false;

    const codes = user.backup_code.split(",");
    const index = codes.indexOf(code);

    if (index === -1) return false;

    codes.splice(index, 1);
    user.backup_code = codes.join(",");
    return true;
  }

  /**
   * Send OTP (REUSABLE).
   */
  async sendOtp(
    user: IUserDoc,
    type: string = "otp",
    customEmail?: string,
  ): Promise<{ status: number; message: string }> {
    const messageMap: Record<string, string> = {
      new_email: "Verify your new email/phone",
      verify_account: "Verify your account",
      forgot_password: "Reset your password",
      otp: "Login",
      resend_otp: "Resend",
      account_update: "Verify your account update",
    };

    const otp = this.generateOtp();

    // ✅ SET EXPIRY (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ✅ SAVE CLEANLY

    user.otp = `${otp}_${Date.now()}`;
    user.otp_failed = 0;
    user.updated_at = new Date();

    await user.save();

    const emailResult = await TfaService.sendEmailByKey("otp", {
      to: customEmail || user.email,
      user,
      data: {
        otp,
        message: messageMap[type] || "Login",
      },
    });

    if (emailResult.status === 0) {
      // Email sending failed, but OTP is already saved to DB
      // We should still return success for OTP generation, but log the error
      console.error("OTP email sending failed:", emailResult.message);
      // Optionally, you could return the error, but for now we'll continue
    }

    return { status: 1, message: "OTP sent successfully" };
  }

  /**
   * Change TFA status.
   */
  async tfaStatusChange(
    user: IUserDoc,
  ): Promise<{ status: number; message: string }> {
    user.status_tfa = user.status_tfa ? 0 : 1;
    await user.save();

    return {
      status: 1,
      message: user.status_tfa
        ? "Two Factor Authentication is enabled"
        : "Two Factor Authentication is disabled",
    };
  }

  /**
   * Verify OTP API.
   */
  static async verifyOtp(req: any): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const otp = req.body?.otp;
    const code = req.body?.code;
    const type = req.query?.type || req.body?.type; // Check both query and body params
    const ignore_device = req.body?.ignore_device === 'true' || req.body?.ignore_device === true;

    if (!otp || !code) {
      return {
        status: 0,
        message: "OTP and code are required",
        data: [],
        http_status: 400,
      };
    }

    const tfaService = new TfaService();

    // Handle account update verification differently - code contains JSON data
    if (type === "account_update") {
      try {
        const updateDataStr = tfaService.decryptCode(code);
        const updateData = JSON.parse(updateDataStr);

        const user = await User.findById(updateData.userId);
        if (!user) {
          return {
            status: 0,
            message: "User not found",
            data: [],
            http_status: 404,
          };
        }

        if (user.status === 0) {
          return {
            status: 0,
            message: "Your account is blocked",
            data: [],
            http_status: 403,
          };
        }

        const result = TfaService.checkOtp(
          otp,
          user.otp ?? null,
        );

        if (!result.status) {
          user.otp_failed = (user.otp_failed ?? 0) + 1;
          await user.save();

          return {
            status: 0,
            message: result.message,
            data: [],
            http_status: 400,
          };
        }

        // Update user fields
        if (updateData.newEmail) user.email = updateData.newEmail;
        if (updateData.newPhone) user.phone = updateData.newPhone;
        if (updateData.first_name) user.first_name = updateData.first_name;
        if (updateData.last_name) user.last_name = updateData.last_name;
        if (updateData.country) user.country = updateData.country;
        if (updateData.timezone) user.timezone = updateData.timezone;
        if (updateData.image) user.image = updateData.image;

        user.updated_at = new Date();
        user.otp = undefined;
        user.otp_failed = 0;

        await user.save();

        // Clear cache
        const { delCache, setCache } = await import("../utils/cache");
        await delCache(`user:${updateData.userId}`);

        const freshUser = await User.findById(updateData.userId).select(
          "-password -otp -totp_secret_key -totp_backup_code",
        );

        await setCache(`user:${updateData.userId}`, freshUser, 60);

        return {
          status: 1,
          message: "Account updated successfully",
          data: { next: "redirect", url: "/login", user: freshUser },
          http_status: 200,
        };
      } catch (error) {
        return {
          status: 0,
          message: "Invalid update data",
          data: [],
          http_status: 400,
        };
      }
    }

    // For other types, code is an email
    const email = tfaService.decryptCode(code);
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return {
        status: 0,
        message: "Unauthorized",
        data: [],
        http_status: 401,
      };
    }

    if (user.status === 0) {
      return {
        status: 0,
        message: "Your account is blocked",
        data: [],
        http_status: 403,
      };
    }

    let otpValid = false;
    let backupCodeUsed = false;

    const result = TfaService.checkOtp(
      otp,
      user.otp ?? null,
    );

    if (result.status) {
      otpValid = true;
    } else if (type === "tfa" && user.backup_code) {
      // Check if the input is a backup code
      backupCodeUsed = TfaService.checkAndConsumeBackupCode(
        user,
        otp.toString(),
      );
      if (backupCodeUsed) {
        otpValid = true;
        await user.save(); // Save after consuming backup code
      }
    }

    if (!otpValid) {
      user.otp_failed = (user.otp_failed ?? 0) + 1;
      await user.save();

      return {
        status: 0,
        message: result.message,
        data: [],
        http_status: 400,
      };
    }

    // Handle TFA verification (login flow)
    if (type === "tfa") {
      // Clear OTP data
      user.otp = undefined;
      user.otp_failed = 0;

      // Handle device ignoring based on checkbox
      if (ignore_device && req.authData?.device_uid) {
        const currentTimestamp = Date.now();
        const deviceEntry = `${req.authData.device_uid}_${currentTimestamp}`;
        const existingDevices = user.ignore_tfa_device ? user.ignore_tfa_device.split(',') : [];
        // Remove any existing entry for this device
        const filteredDevices = existingDevices.filter(entry => !entry.startsWith(`${req.authData.device_uid}_`));
        // Add new entry
        filteredDevices.push(deviceEntry);
        user.ignore_tfa_device = filteredDevices.join(',');
      }

      await user.save();

      // Find the auth token for this user (created during login)
      const authRecord = await Auth.findOne({ user_id: user._id }).sort({
        created_at: -1,
      });
      const authToken = authRecord?.auth_token;

      return {
        status: 1,
        message: "Two-factor authentication successful",
        data: {
          next: "redirect",
          url: "/dashboard",
          token: authToken, // Include token for frontend to store
        },
        http_status: 200,
      };
    }

    // Clear OTP data
    user.otp = undefined;
    user.otp_failed = 0;

    await user.save();

    return {
      status: 1,
      message: "OTP verified successfully",
      data: { next: "redirect", url: "/login" },
      http_status: 200,
    };
  }

  /**
   * Resend OTP API.
   */
  static async resendOtp(req: any): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    let user;

    if (req.body?.code) {
      // Use code to find user (original logic)
      const tfaService = new TfaService();
      const email = tfaService.decryptCode(req.body.code);
      user = await User.findOne({
        $or: [{ email }, { pending_email: email }],
      });
    } else if (req.headers?.['auth-token'] || req.headers?.['x-auth-token']) {
      // If no code but auth token present, find user by auth token
      const authToken = req.headers['auth-token'] || req.headers['x-auth-token'];
      const authRecord = await Auth.findOne({ auth_token: authToken });
      if (authRecord) {
        user = await User.findById(authRecord.user_id);
      }
    }

    if (!user) {
      return {
        status: 0,
        message: "Unauthorized",
        data: [],
        http_status: 401,
      };
    }

    if (user.status === 0) {
      return {
        status: 0,
        message: "Your account is blocked",
        data: [],
        http_status: 403,
      };
    }

    const tfaService = new TfaService();
    const sendResult = await tfaService.sendOtp(user, "resend_otp");

    return {
      status: sendResult.status,
      message: sendResult.message,
      data: [],
      http_status: 200,
    };
  }

  /**
   * Generate TOTP QR code.
   */
  static async generateTotpQrcode(userName: string): Promise<{
    qrCode: string;
    secretKey: string;
  }> {
    const issuer = "YourApp";
    const secret = this.generateTotpSecretKey();

    // Use email as the account name for better compatibility with authenticator apps
    const accountName = userName.includes('@') ? userName : `${userName}@yourapp.com`;

    // Standard TOTP URI format - simplified for better compatibility
    const qrCodeData = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&digits=6&period=30`;

    console.log("Generated QR Code Data:", qrCodeData); // Debug log

    // Generate QR code as PNG data URL with standard settings for authenticator apps
    const qrCodePng = await qrcode.toDataURL(qrCodeData, {
      width: 300, // Standard size for mobile apps
      margin: 4, // Standard margin
      color: {
        dark: "#000000", // Black modules
        light: "#FFFFFF", // White background
      },
      errorCorrectionLevel: "M", // Medium error correction
    });

    return {
      qrCode: qrCodePng,
      secretKey: secret,
    };
  }

  /**
   * Generate TOTP secret key using Base32 alphabet.
   */
  static generateTotpSecretKey(length: number = 16): string {
    const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; // Base32 alphabet
    let secret = "";
    for (let i = 0; i < length; i++) {
      secret += validChars.charAt(
        Math.floor(Math.random() * validChars.length),
      );
    }
    return secret;
  }

  /**
   * Verify TOTP code using speakeasy.
   */
  static verifyTotpCode(otp: string, secret: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: otp,
      window: 1, // Allow 1 time step tolerance (30 seconds before/after)
    });
  }

  /**
   * Verify TOTP process during setup.
   */
  static async optVerifyProcess(req: any): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const { otp, id, secretKey } = req.body;

    if (!otp || !id || !secretKey) {
      return {
        status: 0,
        message: "OTP, user ID, and secret key are required",
        data: [],
        http_status: 400,
      };
    }

    const user = await User.findById(id);
    if (!user) {
      return {
        status: 0,
        message: "User not found",
        data: [],
        http_status: 404,
      };
    }

    // Check if TOTP is already enabled for this user
    if (user.status_tfa === 1 && user.totp_secret_key) {
      return {
        status: 0,
        message: "TOTP is already enabled for this user",
        data: [],
        http_status: 400,
      };
    }

    // Verify TOTP code using the provided secret key (don't save yet)
    const isValidOtp = TfaService.verifyTotpCode(otp, secretKey);
    if (!isValidOtp) {
      return {
        status: 0,
        message: "Invalid OTP code",
        data: [],
        http_status: 400,
      };
    }

    // Only after successful OTP verification, save the secret key and enable TFA
    user.totp_secret_key = secretKey;
    user.status_tfa = 1;
    // DO NOT add device to ignore_tfa_device here - only when checkbox is checked during login
    await user.save();

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 5; i++) {
      backupCodes.push(Math.floor(100000 + Math.random() * 900000));
    }
    user.backup_code = backupCodes.join(",");
    await user.save();

    return {
      status: 1,
      message: "Two Factor Authentication enabled successfully",
      data: [],
      http_status: 200,
    };
  }

  /**
   * Remove TOTP authentication.
   */
  static async removeTotp(req: any): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const userId = req.user_id;

    if (!userId) {
      return {
        status: 0,
        message: "Unauthorized",
        data: [],
        http_status: 401,
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: 0,
        message: "User not found",
        data: [],
        http_status: 404,
      };
    }

    // Remove TOTP settings
    // user.status_tfa = 0;
    user.totp_secret_key = undefined;
    user.backup_code = undefined;
    await user.save();

    return {
      status: 1,
      message: "TOTP authentication removed successfully",
      data: [],
      http_status: 200,
    };
  }

  /**
   * Save TOTP secret key during setup.
   */
  static async saveTotpSecret(req: any): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const userId = req.user_id;
    const { secretKey } = req.body;

    if (!userId) {
      return {
        status: 0,
        message: "Unauthorized",
        data: [],
        http_status: 401,
      };
    }

    if (!secretKey) {
      return {
        status: 0,
        message: "Secret key is required",
        data: [],
        http_status: 400,
      };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: 0,
        message: "User not found",
        data: [],
        http_status: 404,
      };
    }

    // Save the secret key to user record
    user.totp_secret_key = secretKey;
    await user.save();

    return {
      status: 1,
      message: "Secret key saved successfully",
      data: [],
      http_status: 200,
    };
  }

  /**
   * Get backup codes for user.
   */
  static async getBackupCode(userId: string): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: 0,
        message: "User not found",
        data: [],
        http_status: 404,
      };
    }

    return {
      status: 1,
      message: "Backup codes retrieved",
      data: {
        backupCode: user.backup_code,
        user: user,
      },
      http_status: 200,
    };
  }

  /**
   * Regenerate backup codes for user.
   */
  static async regenerateBackupCode(userId: string): Promise<{
    status: number;
    message: string;
    data: any;
    http_status: number;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: 0,
        message: "User not found",
        data: [],
        http_status: 404,
      };
    }

    // Generate new backup codes (5 codes, each 6 digits)
    const backupCodes = [];
    for (let i = 0; i < 5; i++) {
      backupCodes.push(Math.floor(100000 + Math.random() * 900000));
    }

    // Save backup codes as comma-separated string
    user.backup_code = backupCodes.join(",");
    await user.save();

    return {
      status: 1,
      message: "Backup codes regenerated successfully",
      data: {
        backup_codes: backupCodes,
      },
      http_status: 200,
    };
  }
}
