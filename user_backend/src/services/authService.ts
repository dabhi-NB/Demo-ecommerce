import { Request } from "express";
import User from "../models/userModel";
import Auth from "../models/authModel";
import { generateRandomAlnum } from "../utils/general";
import { rateLimit } from "../utils/rateLimit";
import { checkPassword } from "../utils/encryption";
import logger from "../utils/logger";
import { getSetting } from "../utils/settingsHelper"; // Import the getSetting function
import { GeneralHelper } from "../utils/generalHelper";
import { TfaService } from "./TfaService";
import { logUserActivity } from "../models/UserActivityModel";
import DeviceModel from "../models/deviceModel";

export interface AuthServiceResponse {
  http_status: number;
  status: number;
  message: string;
  data?: any;
}

/**
 * Auth Service for handling user authentication operations.
 */
export class AuthService {
  /**
   * Login user and create session
   */
static async login(req: Request): Promise<AuthServiceResponse> {
    try {
      const { email, password, device_uid, timezone } = req.body;
      
      console.log('🔑 [AUTH SERVICE] Full payload:', { email, device_uid: device_uid?.substring(0,8)+'...', timezone });
      console.log('🔑 [AUTH SERVICE] Login attempt START for:', email);

      logger.info(`Login attempt for email: ${email}`);

      // Rate limiting (uncomment if needed)
      const rateLimitResult = await rateLimit(req, email, 215);
      if (!rateLimitResult.status) {
        return {
          http_status: 429,
          status: 0,
          message: "Too many attempts, please try again later.",
        };
      }

      // Validate input
      if (!email || !password) {
        return {
          http_status: 400,
          status: 0,
          message: "Email and password are required.",
        };
      }

      // User lookup by email or phone
      const user = await User.findOne({
        $or: [{ email: email }, { phone: email }],
      });

      console.log('🔑 [AUTH SERVICE] User found:', !!user, user ? { _id: user._id, email: user.email, status: user.status, email_verified: user.email_verified } : 'NO USER');
      
      if (!user) {
        console.log('🔑 [AUTH SERVICE] ❌ NO USER FOUND for:', email);
        logger.info(
          `Login request error: user not found for email/phone: ${email}`
        );
        return {
          http_status: 401,
          status: 0,
          message: "Email/Phone or password is not valid",
        };
      }

      logger.info(`Login attempt for email: ${email}`);
      logger.info(`User status: ${user.status}`);

      if (user.status === 0) {
        return {
          http_status: 403,
          status: 0,
          message: "Your Account is blocked",
        };
      }

      // Check login attempt ban
      const maxAttempt = Number(process.env.LOGIN_MAX_ATTEMPT || 5);
      const banTime = Number(process.env.LOGIN_BAN_TIME || 900); // seconds
      if (
        (user.login_failed || 0) >= maxAttempt &&
        user.login_failed_at &&
        new Date(user.login_failed_at).getTime() + banTime * 1000 > Date.now()
      ) {
        const remainingMinutes = Math.ceil(
          (new Date(user.login_failed_at).getTime() +
            banTime * 1000 -
            Date.now()) /
          60000
        );
        return {
          http_status: 429,
          status: 0,
          message: `Max login attempt exceed. Please Try after ${remainingMinutes} Minutes`,
        };
      }

      // Check password
      const isMatch = await checkPassword(password, user.password || "");
      if (!isMatch) {
        user.login_failed = (user.login_failed || 0) + 1;
        user.login_failed_at = new Date();
        await user.save();

        // Optionally log failed login
        // await logUserActivity({ user_id: user._id, type: 0, device_id: device_uid, ip: req.ip || '', client: req.headers['user-agent'] || '' });

        return {
          http_status: 401,
          status: 0,
          message: "Email or password is not valid",
        };
      }

      const email_verifiedy =
        (await getSetting("setting.user_email_verify")) || "0";
      if (String(email_verifiedy) === "1" && user.email_verified !== 1) {
        logger.info(`Blocked login: email not verified for ${email}`);
        const tfaService = new TfaService();
        await tfaService.sendOtp(user, "verify_account");
        return {
          http_status: 403,
          status: 0,
          message:
            "Please verify your email to continue. Click here to verify.",
          data: {
            verifyUrl: encodeURIComponent(
              Buffer.from(user.email || "").toString("base64")
            ),
          },
        };
      }

      // Reset failed login count
      if (user.login_failed) {
        user.login_failed = 0;
        await user.save();
      }

      // Generate unique auth token
      let auth_token: string;
      let tokenExists = true;
      do {
        auth_token = generateRandomAlnum(64);
        tokenExists = !!(await Auth.exists({ auth_token }));
      } while (tokenExists);

      const auth_token_expire_at = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ); // 30 days
      const client = req.headers["user-agent"] || "";
      const reqTimezone = req.body.timezone || "UTC";

      // Save the session in the database
      const existingAuth = await Auth.findOne({ device_uid });
      const now = new Date();

      if (existingAuth) {
        existingAuth.user_id = user._id as any;
        existingAuth.auth_token = auth_token;
        existingAuth.auth_token_expire_at = auth_token_expire_at;
        existingAuth.timezone = reqTimezone;
        existingAuth.client = client;
        existingAuth.ip = req.ip || "";
        existingAuth.updated_at = now;
        await existingAuth.save();
      } else {
        await Auth.create({
          user_id: user._id,
          device_uid,
          auth_token,
          auth_token_expire_at,
          timezone,
          client,
          ip: req.ip || "",
          created_at: now,
          updated_at: now,
        });
      }

      // 🔹 Update device info
      await DeviceModel.findOneAndUpdate(
        { user_id: user._id as any, device_uid },
        {
          user_id: user._id as any,
          device_uid,
          client: req.headers["user-agent"] || "",
          ip: req.ip || "",
          is_current_device: true,
          last_activity: new Date(),
          last_login_at: new Date(),
        },
        { upsert: true, new: true }
      );

      // 🔹 Mark other devices as not current
      await DeviceModel.updateMany(
        {
          user_id: user._id,
          device_uid: { $ne: device_uid },
          is_current_device: true,
        },
        { is_current_device: false }
      );

      // Check if TFA is enabled and current device should bypass TFA (is in ignore_tfa_device)
      if (user.status_tfa === 1) {
        const ignoredDevices = user.ignore_tfa_device
          ? user.ignore_tfa_device.split(",").map(entry => entry.split('_')[0])
          : [];
        if (!ignoredDevices.includes(device_uid)) {
          // This device is not ignored, so require TFA
          const tfaService = new TfaService();
          await tfaService.sendOtp(user, "otp");

          // Optionally log successful login
          await logUserActivity({
            user_id: user._id as any,
            type: 1,
            device_id: device_uid,
            ip: req.ip || "",
            client,
          });

          logger.info(`User logged in with TFA required: ${email}`, {
            timestamp: new Date().toISOString(),
          });
          return {
            http_status: 200,
            status: 1,
            message: "Login success, TFA required",
            data: {
              token: auth_token,
              user: {
                user_id: user._id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                image: user.image,
                status_tfa: true, // TFA is enabled for this device
              },
              next: "redirect",
              url: "/auth/verify?type=tfa",
            },
          };
        }
      }

      // Optionally log successful login
      await logUserActivity({
        user_id: user._id as any,
        type: 1,
        device_id: device_uid,
        ip: req.ip || "",
        client,
      });

      logger.info(`User logged in: ${email}`, {
        timestamp: new Date().toISOString(),
      });
      return {
        http_status: 200,
        status: 1,
        message: "Login success",
        data: {
          token: auth_token,
          user: {
            user_id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            image: user.image,
            status_tfa: user.status_tfa === 1,
          },
          next: "redirect",
          url: "/dashboard", // or whatever the default redirect is
        },
      };
    } catch (error) {
      logger.error("Error in AuthService.login:", error);
      return {
        http_status: 500,
        status: 0,
        message: "An unexpected error occurred. Please try again later.",
      };
    }
  }

  /**
   * Logout user by removing session
   */
  static async logout(authToken: string): Promise<AuthServiceResponse> {
    try {
      const result = await Auth.findOneAndDelete({ auth_token: authToken });

      if (!result) {
        return { http_status: 404, status: 0, message: "Session not found" };
      }

      logger.info(`User logged out, session deleted`);
      return { http_status: 200, status: 1, message: "Logout successful" };
    } catch (error) {
      logger.error("Error in AuthService.logout:", error);
      return { http_status: 500, status: 0, message: "Logout failed" };
    }
  }

  /**
   * Refresh user authentication token
   */
  static async refreshToken(authToken: string): Promise<AuthServiceResponse> {
    try {
      const authDoc = await Auth.findOne({ auth_token: authToken });

      if (!authDoc) {
        return { http_status: 401, status: 0, message: "Invalid token" };
      }

      // Extend token expiry by 30 days
      authDoc.auth_token_expire_at = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      authDoc.updated_at = new Date();
      await authDoc.save();

      logger.info(`Token refreshed for user: ${authDoc.user_id}`);
      return {
        http_status: 200,
        status: 1,
        message: "Token refreshed successfully",
      };
    } catch (error) {
      logger.error("Error in AuthService.refreshToken:", error);
      return { http_status: 500, status: 0, message: "Token refresh failed" };
    }
  }

  /**
   * Login user using OTP (One-Time Password)
   */
  static async loginOtp(req: Request): Promise<AuthServiceResponse> {
    try {
      const { email, otp, step, device_uid, timezone, recaptcha_token } =
        req.body;
      const currentStep = Number(step);

      if (![1, 2].includes(currentStep))
        return { http_status: 400, status: 0, message: "Invalid login step." };

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return {
          http_status: 400,
          status: 0,
          message: "Invalid email address.",
        };

      const user = await User.findOne({ email });
      if (!user)
        return {
          http_status: 404,
          status: 0,
          message:
            currentStep === 1 ? "Email not registered." : "Invalid request.",
        };
      if (user.status === 0)
        return {
          http_status: 403,
          status: 0,
          message: "Your account is blocked.",
        };

      // Email verification - always required
      if (user.email_verified !== 1) {
        logger.info(`Blocked OTP login: email not verified for ${email}`);
        const tfaService = new TfaService();
        await tfaService.sendOtp(user, "verify_account");
        return {
          http_status: 403,
          status: 0,
          message:
            "Please verify your email to continue. Click here to verify.",
          data: {
            verifyUrl: encodeURIComponent(
              Buffer.from(user.email || "").toString("base64")
            ),
          },
        };
      }

      const rateLimitResult = await rateLimit(req, email, 215);
      if (!rateLimitResult.status) {
        return {
          http_status: 429,
          status: 0,
          message: "Too many login attempts. Please try again later.",
        };
      }

      const tfaService = new TfaService();

      if (currentStep === 1) {
        const recaptchaSecret =
          (await getSetting("setting.google_recaptcha_secret_key")) || "";
        if (
          recaptchaSecret &&
          (await GeneralHelper.recaptchaFails(req, recaptchaSecret))
        )
          return {
            http_status: 400,
            status: 0,
            message: "Please complete the captcha verification.",
          };

        const otpResult = await tfaService.sendOtp(user, "otp");
        return otpResult.status === 1
          ? {
            http_status: 200,
            status: 1,
            message: otpResult.message || "OTP sent.",
            data: { next: "step_2" },
          }
          : {
            http_status: 500,
            status: 0,
            message: otpResult.message || "Failed to send OTP.",
          };
      }

      // Step 2: Verify OTP
      if (!otp)
        return { http_status: 400, status: 0, message: "OTP is required." };
      if (!user.otp) {
        user.otp_failed = (user.otp_failed || 0) + 1;
        await user.save();
        return { http_status: 400, status: 0, message: "OTP is invalid." };
      }

      const [storedOtp, storedTime] = user.otp.split("_");
      const isExpired =
        Date.now() >
        Number(storedTime) + Number(process.env.OTP_EXPIRE_SEC || 300) * 1000;

      if (isExpired || otp !== storedOtp) {
        user.otp_failed = (user.otp_failed || 0) + 1;
        await user.save();
        return {
          http_status: 400,
          status: 0,
          message: isExpired ? "OTP has expired." : "OTP is invalid.",
        };
      }

      // Success: reset OTP & create auth token
      user.otp = undefined;
      user.otp_failed = 0;
      await user.save();

      // Mark TFA as verified permanently for this user
      if (user.status_tfa === 1 && !(user as any).tfa_verified_once) {
        (user as any).tfa_verified_once = true;
        await user.save();
      }

      let auth_token: string;
      do {
        auth_token = generateRandomAlnum(64);
      } while (await Auth.exists({ auth_token }));

      const expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await DeviceModel.findOneAndUpdate(
        { user_id: user._id as any, device_uid },
        {
          user_id: user._id as any,
          device_uid,
          client: req.headers["user-agent"] || "",
          ip: req.ip || "",
          is_current_device: true,
          last_activity: new Date(),
          last_login_at: new Date(),
        },
        { upsert: true, new: true }
      );

      // Store user ID in session for OTP verification
      if ((req as any).session) {
        (req as any).session.user_id = (user._id as any).toString();
        (req as any).session.device_uid = device_uid;
        (req as any).session.email = user.email;
      }

      // Log user activity for OTP login
      await logUserActivity({
        user_id: user._id as any,
        type: 4, // 4 = OTP login
        device_id: device_uid,
        ip: req.ip || "", // Ensure ip is always a string
        client: req.headers["user-agent"] || "",
      });
      await DeviceModel.findOneAndUpdate(
        { user_id: user._id as any, device_uid },
        {
          user_id: user._id as any,
          device_uid,
          client: req.headers["user-agent"] || "",
          ip: req.ip || "",
          is_current_device: true,
          last_activity: new Date(),
        },
        { upsert: true, new: true }
      );

      await DeviceModel.updateMany(
        {
          user_id: user._id as any,
          device_uid: { $ne: device_uid },
          is_current_device: true,
        },
        { is_current_device: false }
      );

      return {
        http_status: 200,
        status: 1,
        message: "Login successful.",
        data: {
          token: auth_token,
          user: {
            user_id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            image: user.image,
            status_tfa: user.status_tfa === 1,
          },
          next: "redirect",
        },
      };
    } catch (error) {
      logger.error("AuthService.loginOtp error:", error);
      return {
        http_status: 500,
        status: 0,
        message: "An unexpected error occurred. Please try again later.",
      };
    }
  }
}
