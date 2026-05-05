import { Request } from "express";
import User from "../models/userModel";
import Auth from "../models/authModel";
import { accountRegisterSchema } from "../validators/RegisterValidator";
import { changePasswordSchema } from "../validators/authValidator";
import { encryptPassword } from "../utils/encryption";
import { rateLimit } from "../utils/rateLimit";
import logger from "../utils/logger";
import { generateRandomAlnum } from "../utils/general";
import { getSetting } from "../utils/settingsHelper";
import UserActivityModel, {
  logUserActivity,
} from "../models/UserActivityModel";
import { accountUpdateSchema } from "../validators/accountValidator";
import { delCache, setCache } from "../utils/cache";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { TfaService } from "./TfaService";
import fs from "fs";
import path from "path";
import { GeneralHelper } from "../utils/generalHelper";
import DeviceModel from "../models/deviceModel";

export interface AccountServiceResponse {
  http_status?: number;
  status: number;
  message: string;
  data?: any;
  next?: "redirect" | "reload" | "refresh" | "step_2" | "step_3";
  url?: string;
}

export class AccountService {
  /**
   * Register new user account
   */

  static async register(
    req: Request,
    data: any,
  ): Promise<AccountServiceResponse> {
    try {
      const { error, value } = accountRegisterSchema.validate(data);
      if (error) return { status: 0, message: error.details[0].message };

      const {
        email,
        phone,
        password,
        first_name,
        last_name,
        timezone,
        country,
        device_uid,
      } = value;
      if (!device_uid) return { status: 0, message: "Device ID is required" };

      // Automatically detect country from IP if not provided
      let detectedCountry = country || "";
      if (!detectedCountry) {
        try {
          const ipInfo = await GeneralHelper.getIpInfo(req.ip || "");
          if (ipInfo && ipInfo.country) {
            detectedCountry = ipInfo.country;
          }
        } catch (e) {
          // Ignore errors in location detection
        }
      }

      const rateResult = await rateLimit(req, `register_${req.ip}`, 5, 60 * 60);
      if (!rateResult.status)
        return { status: 0, message: "Too many attempts. Try later." };

      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return {
          status: 0,
          message:
            existingUser.email === email
              ? "Email already registered"
              : "Phone already registered",
        };
      }

      const hashedPassword = await encryptPassword(password);
      const emailVerifySetting =
        (await getSetting("setting.user_email_verify")) || "0";

      const user = new User({
        role: 4,
        first_name,
        last_name,
        email,
        phone,
        password: hashedPassword,
        timezone: timezone || "UTC",
        country: detectedCountry,
        registered_ip: req.ip || "",
        email_verified: emailVerifySetting === "0" ? 1 : 0, // ✅ auto-verify if email verification off
        status: 1,
        status_tfa: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await user.save();

      await logUserActivity({
        user_id: user._id as mongoose.Types.ObjectId,
        type: 2, // register
        device_id: device_uid,
        ip: req.ip || "",
        client: req.headers["user-agent"] || "",
      });

      if (emailVerifySetting === "1") {
        // EMAIL VERIFICATION ON → send OTP
        const tfaService = new TfaService();
        const otpResult = await tfaService.sendOtp(user, "verify_account");
        if (otpResult.status !== 1) {
          return {
            status: 0,
            message: otpResult.message || "Failed to send verification email",
          };
        }

        const code = Buffer.from(user.email).toString("base64");
        return {
          status: 1,
          message: "Please verify your email",
          next: "redirect",
          url: `site/verify-account?code=${code}`,
        };
      }

      // EMAIL VERIFICATION OFF → auto-login + send welcome email
      const auth_token = generateRandomAlnum(64);
      await Auth.create({
        user_id: user._id,
        device_uid,
        auth_token,
        auth_token_expire_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        timezone: timezone || "UTC",
        country: detectedCountry,
        client: req.headers["user-agent"] || "",
        ip: req.ip || "",
        created_at: new Date(),
        updated_at: new Date(),
      });

      await logUserActivity({
        user_id: user._id as mongoose.Types.ObjectId,
        type: 1, // login
        device_id: device_uid,
        ip: req.ip || "",
        client: req.headers["user-agent"] || "",
      });

      // ✅ Send Welcome Email
      try {
        await TfaService.sendEmailByKey("welcome", {
          to: user.email,
          data: {
            first_name: user.first_name,
            last_name: user.last_name,
            app_name: (await getSetting("setting.app_name")) || "Your App Name",
          },
        });
      } catch (e) {
        logger.error("Welcome email failed:", e);
      }

      return {
        status: 1,
        message: "Registration successful",
        data: { token: auth_token, user },
      };
    } catch (error: any) {
      logger.error("AccountService.register error:", error);
      return { status: 0, message: error.message || "Internal server error" };
    }
  }

  static async verifyAccount(data: any): Promise<AccountServiceResponse> {
    const { otp, code } = data;
    if (!otp || !code) return { status: 0, message: "OTP or code missing" };

    const email = Buffer.from(code, "base64").toString("utf8");
    const user = await User.findOne({ email });
    if (!user) return { status: 0, message: "Invalid code" };

    if ((user.otp_failed || 0) >= 5)
      return { status: 0, message: "Too many attempts" };

    const result = TfaService.checkOtp(
      otp,
      user.otp || null,
    );

    if (!result.status) {
      user.otp_failed = (user.otp_failed || 0) + 1;
      await user.save();
      return { status: 0, message: result.message };
    }

    user.email_verified = 1;
    user.otp = undefined;
    user.otp_failed = 0;
    await user.save();

    // ✅ Send Welcome Email after verification
    try {
      await TfaService.sendEmailByKey("welcome", {
        to: user.email,
        data: {
          first_name: user.first_name,
          last_name: user.last_name,
          app_name: (await getSetting("setting.app_name")) || "Your App Name",
        },
      });
    } catch (e) {
      logger.error("Welcome email failed:", e);
    }

    return {
      status: 1,
      message: "OTP verified successfully",
      next: "redirect",
      url: "/login",
    };
  }

  static async forgotPassword(
    req: Request,
    data: any,
  ): Promise<AccountServiceResponse> {
    const { email, otp, password, password_confirm, step } = data;
    const tfaService = new TfaService();

    // -------------------------
    // STEP 1 → SEND OTP
    if (step === 1) {
      if (!email) return { status: 0, message: "Email is required" };

      const user = await User.findOne({ email });
      if (!user) return { status: 0, message: "Email not found" };

      // Rate limit
      const rate = await rateLimit(req, `forgot_${email}`, 5, 15 * 60);
      if (!rate.status) {
        return { status: 0, message: "Too many attempts. Try later." };
      }

      await tfaService.sendOtp(user, "forgot_password");

      return {
        status: 1,
        message: "OTP sent to your email",
        next: "step_2",
      };
    }
    // -------------------------
    // STEP 2 → VERIFY OTP
    if (step === 2) {
      if (!email || !otp) {
        return { status: 0, message: "Email & OTP required" };
      }

      const user = await User.findOne({ email });
      if (!user) return { status: 0, message: "Invalid request" };

      const result = TfaService.checkOtp(
        otp,
        user.otp ?? null,
      );

      if (!result.status) {
        user.otp_failed = (user.otp_failed ?? 0) + 1;
        await user.save();
        return { status: 0, message: result.message };
      }

      return {
        status: 1,
        message: "OTP verified",
        next: "step_3",
      };
    }

    // -------------------------
    // STEP 3 → RESET PASSWORD
    if (step === 3) {
      if (!email || !password || !password_confirm) {
        return { status: 0, message: "All fields are required" };
      }

      if (password !== password_confirm) {
        return { status: 0, message: "Passwords do not match" };
      }

      const user = await User.findOne({ email });
      if (!user) return { status: 0, message: "Invalid request" };

      user.password = await encryptPassword(password);
      user.otp = undefined;
      user.otp_failed = 0;
      user.updated_at = new Date();
      await user.save();

      return {
        status: 1,
        message: "Password reset successfully",
        next: "redirect",
        url: "/login",
      };
    }

    return { status: 0, message: "Invalid step" };
  }

  static async getProfile(userId: string): Promise<AccountServiceResponse> {
    try {
      const user = await User.findById(userId).select(
        "-password -otp -totp_secret_key -totp_backup_code",
      );

      if (!user) {
        return { status: 0, message: "User not found" };
      }

      return {
        status: 1,
        message: "Profile retrieved successfully",
        data: user,
      };
    } catch (error) {
      logger.error("Error in AccountService.getProfile:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async changePassword(
    req: Request,
    userId: string,
    data: any,
  ): Promise<AccountServiceResponse> {
    try {
      const { current_password, password, confirm_password } = data;
      const { error, value } = changePasswordSchema.validate(data);

      const rate = await rateLimit(
        req,
        `password_change_${userId}`,
        5,
        60 * 60,
      );

      const user = await User.findById(userId);
      if (!user) {
        return { status: 0, message: "User not found" };
      }

      const isMatch = await bcrypt.compare(
        current_password,
        user.password || "",
      );

      if (!isMatch) {
        return { status: 0, message: "Old password does not match!" };
      }

      // ✅ Update password
      user.password = await encryptPassword(confirm_password);
      user.updated_at = new Date();
      await user.save();

      const currentToken = req.headers["auth-token"] as string;
      await Auth.deleteMany({
        user_id: userId,
        auth_token: { $ne: currentToken },
      });

      return {
        status: 1,
        message: "Password Updated Successfully",
        next: "refresh", // Laravel same
      };
    } catch (error) {
      logger.error("changePassword error:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async updateImage(
    userId: string,
    imagePath: string,
  ): Promise<AccountServiceResponse> {
    try {
      const filename = path.basename(imagePath);
      const user = await User.findByIdAndUpdate(
        userId,
        {
          image: filename,
          updated_at: new Date(),
        },
        { new: true },
      ).select("-password -otp -totp_secret_key -totp_backup_code");

      if (!user) {
        return { status: 0, message: "User not found" };
      }

      logger.info(`Profile image updated for user: ${user.email}`);
      return {
        status: 1,
        message: "Profile image updated successfully",
        data: { image: user.image, user },
      };
    } catch (error) {
      logger.error("Error in AccountService.updateImage:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async deleteImage(userId: string): Promise<AccountServiceResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 0, message: "User not found" };
      }

      if (!user.image) {
        return { status: 0, message: "No profile image to delete" };
      }
      const imagePath = path.join(process.cwd(), '..', 'express_admin', 'upload', 'user_profile', user.image);

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      user.image = "";
      user.updated_at = new Date();
      await user.save();

      await delCache(`user:${userId}`);

      logger.info(`Profile image deleted for user: ${user.email}`);

      return {
        status: 1,
        message: "Profile image deleted successfully",
        data: { image: "" },
      };
    } catch (error) {
      logger.error("Error in AccountService.deleteImage:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async getUserSessions(
    userId: string,
  ): Promise<AccountServiceResponse> {
    try {
      const sessions = await Auth.find({ user_id: userId })
        .select(
          "device_uid client ip created_at auth_token_expire_at updated_at",
        )
        .sort({ updated_at: -1 });

      return {
        status: 1,
        message: "Sessions retrieved successfully",
        data: sessions,
      };
    } catch (error) {
      logger.error("Error in AccountService.getUserSessions:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async logoutSession(
    userId: string,
    sessionId: string,
  ): Promise<AccountServiceResponse> {
    try {
      const result = await Auth.findOneAndDelete({
        _id: sessionId,
        user_id: userId,
      });

      if (!result) {
        return { status: 0, message: "Session not found" };
      }

      return { status: 1, message: "Session terminated successfully" };
    } catch (error) {
      logger.error("Error in AccountService.logoutSession:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async logoutAllSessions(
    userId: string,
    keepCurrentSession?: string,
  ): Promise<AccountServiceResponse> {
    try {
      const query: any = { user_id: userId };

      if (keepCurrentSession) {
        query.auth_token = { $ne: keepCurrentSession };
      }

      const result = await Auth.deleteMany(query);

      const message = keepCurrentSession
        ? "All other sessions terminated successfully"
        : "All sessions terminated successfully";

      return {
        status: 1,
        message,
        data: { sessionsTerminated: result.deletedCount },
      };
    } catch (error) {
      logger.error("Error in AccountService.logoutAllSessions:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async getUserActivityList(userId: string, payload: any): Promise<any> {
    try {
      const draw = Number(payload.draw || 1);
      const start = Number(payload.start || 0);
      const length = Number(payload.length || 10);
      const searchValue = payload.search?.value?.trim() || "";

      const match: any = {
        user_id: new mongoose.Types.ObjectId(userId),
      };

      if (searchValue) {
        match.$or = [
          { ip: { $regex: searchValue, $options: "i" } },
          { client: { $regex: searchValue, $options: "i" } },
          { device_id: { $regex: searchValue, $options: "i" } },
        ];
      }

      const recordsTotal = await UserActivityModel.countDocuments({
        user_id: match.user_id,
      });

      const recordsFiltered = await UserActivityModel.countDocuments(match);

      const data = await UserActivityModel.find(match)
        .sort({ created_at: -1 })
        .skip(start)
        .limit(length)
        .lean();

      const formatted = await Promise.all(
        data.map(async (row, index) => ({
          id: row.id,
          sr_no: start + index + 1,
          type: row.type,
          device_id: row.device_id,
          ip: row.ip,
          client: row.client,
          created_at: row.created_at,
          location: row.location || (await GeneralHelper.getIpLocation(row.ip)), // ← Laravel-style
        })),
      );

      return {
        draw,
        recordsTotal,
        recordsFiltered,
        data: formatted,
      };
    } catch (error) {
      console.error("UserActivityList error 👉", error);
      return {
        draw: 1,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      };
    }
  }

  static async updateAccount(
    userId: string,
    data: any,
  ): Promise<AccountServiceResponse> {
    const { error, value } = accountUpdateSchema.validate(data);
    if (error) {
      return { status: 0, message: error.details[0].message };
    }

    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 0, message: "User not found" };
      }

      user.first_name = value.first_name;
      user.last_name = value.last_name;

      const emailChanged =
        value.email && value.email.trim() !== "" && value.email !== user.email;

      const phoneChanged =
        value.phone && value.phone.trim() !== "" && value.phone !== user.phone;

      if (emailChanged) {
        const existingEmailUser = await User.findOne({
          email: value.email.trim(),
        });
        if (
          existingEmailUser &&
          (existingEmailUser._id as mongoose.Types.ObjectId).toString() !==
          userId
        ) {
          return {
            status: 0,
            message: "Email already in use by another account",
          };
        }
      }

      if (phoneChanged) {
        const existingPhoneUser = await User.findOne({
          phone: value.phone.trim(),
        });
        if (
          existingPhoneUser &&
          (existingPhoneUser._id as mongoose.Types.ObjectId).toString() !==
          userId
        ) {
          return {
            status: 0,
            message: "Phone already in use by another account",
          };
        }
      }

      if (value.country) user.country = value.country;
      if (value.timezone) user.timezone = value.timezone;
      if (value.image) user.image = value.image;

      user.updated_at = new Date();

      if (emailChanged || phoneChanged) {
        const tfaService = new TfaService();

        const otpEmail = emailChanged ? value.email.trim() : user.email;

        const otpResult = await tfaService.sendOtp(
          user,
          "account_update",
          otpEmail,
        );
        if (otpResult.status !== 1) {
          return { status: 0, message: otpResult.message };
        }

        const updateData = {
          userId,
          newEmail: emailChanged ? value.email.trim() : null,
          newPhone: phoneChanged ? value.phone.trim() : null,
          first_name: value.first_name,
          last_name: value.last_name,
          country: value.country,
          timezone: value.timezone,
          image: value.image,
        };

        const code = Buffer.from(JSON.stringify(updateData)).toString("base64");

        return {
          status: 1,
          message: "Please verify your updated email / phone",
          next: "redirect",
          url: `/auth/verify?code=${code}&type=account_update`,
        };
      }

      await user.save();

      await delCache(`user:${userId}`);

      const freshUser = await User.findById(userId).select(
        "-password -otp -totp_secret_key -totp_backup_code",
      );

      await setCache(`user:${userId}`, freshUser, 60);

      return {
        status: 1,
        message: "Profile updated successfully",
        data: freshUser,
      };
    } catch (error) {
      logger.error("updateAccount error:", error);
      return { status: 0, message: "Internal server error" };
    }
  }

  static async deviceList(userId: string, page = 1, perPage = 10, search = "") {
    const query: any = { user_id: userId };

    if (search) {
      query.$or = [
        { client: { $regex: search, $options: "i" } },
        { ip: { $regex: search, $options: "i" } },
      ];
    }

    const total = await DeviceModel.countDocuments({ user_id: userId });
    const devices = await DeviceModel.find(query)
      .sort({ last_activity: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const rows = devices.map((d) => ({
      id: d._id,
      client: d.client,
      ip: d.ip,
      location: d.location || "-", // backend me IP se location fetch karke save karna
      last_activity: d.last_activity ? d.last_activity.toISOString() : "-",
      action: d.is_current_device ? "logout" : "-",
    }));

    return {
      data: rows,
      recordsFiltered: total,
    };
  }

  static async logoutDevice(userId: string, deviceId: string) {
    try {
      if (!deviceId) {
        return {
          status: 0,
          message: "Device ID is required",
        };
      }

      const device = await DeviceModel.findOne({
        id: deviceId,
        user_id: userId,
      });

      if (!device) {
        return {
          status: 0,
          message: "Device not found",
        };
      }

      if (device.is_current_device) {
        return {
          status: 0,
          message: "You cannot logout current device",
        };
      }

      await DeviceModel.deleteOne({ id: deviceId });

      await Auth.deleteMany({
        user_id: userId,
        device_uid: device.device_uid,
      });

      return {
        status: 1,
        message: "Device logged out successfully",
      };
    } catch (error) {
      console.error("logoutDevice error 👉", error);
      return {
        status: 0,
        message: "Internal server error",
      };
    }
  }

  static async deactivateAccount(
    userId: string,
  ): Promise<AccountServiceResponse> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: "0", // Laravel jaisa
          updated_at: new Date(),
        },
        { new: true },
      );

      if (!user) {
        return {
          http_status: 404,
          status: 0,
          message: "User not found",
          data: [],
        };
      }

      return {
        http_status: 200,
        status: 1,
        message: "Account deactivated successfully",
        data: [],
        next: "redirect",
        url: "/",
      };
    } catch (error) {
      console.error("SERVICE DEACTIVATE ERROR 👉", error);
      return {
        http_status: 500,
        status: 0,
        message: "Internal server error",
        data: [],
      };
    }
  }
  static async revokeAll2FADevices(
    userId: string,
  ): Promise<AccountServiceResponse> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { status: 0, message: "User not found" };
      }

      user.ignore_tfa_device = "";
      user.status_tfa = 0; // Also disable TFA when revoking all devices
      // user.totp_secret_key = undefined;
      // user.backup_code = undefined;  // Remove TOTP settings
      await user.save();

      return {
        status: 1,
        message:
          "Your Devices Revoked Successfully. Two Factor Authentication has been disabled.",
        next: "refresh",
      };
    } catch (error) {
      logger.error("revokeAll2FADevices error:", error);
      return { status: 0, message: "Internal server error" };
    }
  }
}
