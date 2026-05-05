import { Request } from "express";
import mongoose from "mongoose";
import UserSendMail from "../models/userSendMailModel";
import logger from "../utils/logger";
import { TfaService } from "./TfaService";
import Auth from "../models/authModel";
import User from "../models/userModel";
import { getCache } from "../utils/cache";

export interface GeneralServiceResponse {
  status: number;
  message: string;
  data?: any;
  http_status?: number;
}

export class GeneralService {
  static async getUserIdFromToken(
    req: Request
  ): Promise<mongoose.Types.ObjectId | null> {
    try {
      // ✅ Accept both x-auth-token or Authorization header
      let authToken = req.headers["x-auth-token"] as string | undefined;

      // ✅ Support Authorization: Bearer token
      if (!authToken && req.headers["authorization"]) {
        const authHeader = req.headers["authorization"] as string;
        if (authHeader.startsWith("Bearer ")) {
          authToken = authHeader.split(" ")[1];
        }
      }

      if (!authToken) {
        return null;
      }

      const authKey = `auth:token:${authToken}`;
      let authData: any = null;

      // Try cache first
      const cached = await getCache(authKey);
      if (cached) {
        try {
          authData = JSON.parse(cached);
        } catch {
          authData = null;
        }
      }

      // If not in cache, load from DB
      if (!authData) {
        const dbAuth = await Auth.findOne({ auth_token: authToken }).lean();
        if (!dbAuth) {
          return null;
        }
        authData = dbAuth;
      }

      // Check token expiry
      if (new Date() > new Date(authData.auth_token_expire_at)) {
        return null;
      }

      // ✅ Fetch user data
      const userKey = `user:${authData.user_id}`;
      let userData: any = null;
      const cachedUser = await getCache(userKey);
      if (cachedUser) {
        try {
          userData = JSON.parse(cachedUser);
        } catch {
          userData = null;
        }
      }

      if (!userData) {
        const dbUser = await User.findById(authData.user_id).lean();
        if (!dbUser) {
          return null;
        }
        userData = dbUser;
      }

      // Check if user is active
      if (userData.status !== 1) {
        return null;
      }

      return authData.user_id;
    } catch (error) {
      return null;
    }
  }

  static async contactProcess(req: Request): Promise<GeneralServiceResponse> {
    try {
      const { name, email, subject, message, user_id } = req.body;

      if (!name || !email || !subject || !message) {
        return {
          status: 0,
          message: "All fields are required",
          http_status: 422,
        };
      }

      // Prevent duplicate submissions
      const existing = await UserSendMail.findOne({
        to_user: email,
        subject,
        message,
      });
      if (existing) {
        return {
          status: 0,
          message: "You have already submitted this message",
          http_status: 409,
        };
      }

      // Get user_id from request body, or fallback to token if user is logged in
      let finalUserId = user_id;

      if (finalUserId === null || finalUserId === undefined) {
        finalUserId = await this.getUserIdFromToken(req);
      }

      // Save to database
      const contact = await UserSendMail.create({
        user_id: finalUserId,
        to_user: email,
        subject,
        message,
      });

      // Send admin email (non-blocking)
      TfaService.sendEmailByKey("admin_contact", {
        data: {
          name,
          email,
          subject,
          message,
        },
      }).catch((mailErr) => {});

      return {
        status: 1,
        message: "Thank you for contacting us. We will get back to you soon.",
        data: contact,
        http_status: 200,
      };
    } catch (error: any) {
      return { status: 0, message: "Something went wrong", http_status: 500 };
    }
  }
}
