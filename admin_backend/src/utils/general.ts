import crypto from "crypto";
import axios from "axios";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";

// 🔹 Import your own functions
import { getAllSettings } from "../utils/settings";
import { getEmailTemplateByKey } from "../models/emailTemplateModel";
import { renderEmailLayout } from "./emailLayout";

export class GeneralHelper {

  /* =======================
     🔐 RANDOM HELPERS
  ======================= */

  static generateRandomAlnum(length: number = 32): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    while (result.length < length) {
      const buffer = crypto.randomBytes(length);
      for (let i = 0; i < buffer.length && result.length < length; i++) {
        result += chars[buffer[i] % chars.length];
      }
    }
    return result;
  }

  static generateOTP(length: number = 6): string {
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }

  static maskEmail(email: string): string {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    return `${name.substring(0, 2)}***@${domain}`;
  }

  /* =======================
     🌍 IP HELPERS
  ======================= */

  static getClientIp(req: any): string {
    return (
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      ""
    );
  }

  static async getIpLocation(ip: string): Promise<string> {
    try {
      if (!ip || ip === "::1" || ip.startsWith("127.")) {
        return "Localhost";
      }

      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 3000,
      });

      const data = response.data;
      const parts = [];

      if (data.city) parts.push(data.city);
      if (data.region) parts.push(data.region);
      if (data.country_name) parts.push(data.country_name);

      return parts.join(", ") || "Unknown";
    } catch {
      return "Unknown";
    }
  }

  static safeJsonParse<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  /* =======================
     📧 EMAIL HELPERS
  ======================= */

  static async sendEmail(
    to: string,
    template: string,
    data: any,
    queue: boolean = false
  ): Promise<{ status: number; message: string }> {
    try {
      const settings = await getAllSettings();

      data = {
        app_name:
          String(settings["setting.app_name"]) ||
          process.env.APP_NAME ||
          "App",

        first_name: data?.first_name || data?.user?.first_name || "",
        last_name: data?.last_name || data?.user?.last_name || "",
        email: data?.email || data?.user?.email || "",
        ...data,
      };

      const templateData = await this.getEmailTemplate(template, data);

      if (!templateData) {
        return { status: 0, message: "Email template not found" };
      }

      if (!templateData.subject?.trim()) {
        templateData.subject = "Notification";
      }

      if (queue) {
        return { status: 1, message: "Email queued successfully" };
      }

      return await this.sendEmailSMTP(
        to,
        templateData.subject,
        templateData.body
      );
    } catch (error: any) {
      console.error("GeneralHelper.sendEmail error:", error);
      return {
        status: 0,
        message: error.message || "Unexpected error occurred",
      };
    }
  }

  static async sendEmailSMTP(
    to: string,
    subject: string,
    body: string
  ): Promise<{ status: number; message: string }> {
    try {
      const settings = await getAllSettings();
      const logoUrl = settings["setting.app_logo"] ? `${process.env.API_URL?.replace(/\/$/, '')}/${settings["setting.app_logo"]}` : "";

      const transporter = nodemailer.createTransport({
        host: String(settings["mail.mailers.smtp.host"]),
        port: Number(settings["mail.mailers.smtp.port"]) || 587,
        secure:
          (String(settings["mail.mailers.smtp.encryption"]) || "").toLowerCase() ===
          "ssl",
        auth: {
          user: String(settings["mail.mailers.smtp.username"]),
          pass: String(settings["mail.mailers.smtp.password"]),
        },
      });

      const html = renderEmailLayout(
        body,
        String(settings["setting.app_name"]) || "App",
        logoUrl,
      );

      await transporter.sendMail({
        from: `"${settings["mail.from.name"] || "App"}" <${settings["mail.from.address"]
          }>`,
        to,
        subject,
        html,
      });

      return { status: 1, message: "Email sent successfully" };
    } catch (error: any) {
      console.error("SMTP send failed:", error);
      return {
        status: 0,
        message: error.message || "Failed to send email",
      };
    }
  }

  static async getEmailTemplate(
    template: string,
    data: any
  ): Promise<{ subject: string; body: string } | null> {
    const templateObj = await getEmailTemplateByKey(template, data);
    if (!templateObj) return null;
    return templateObj;
  }

  /* =======================
     🗂 FILE HELPERS
  ======================= */

  static async deleteFile(fileName: string, folder: string) {
    const filePath = path.join(
      process.cwd(),
      "uploads",
      folder,
      fileName
    );

    try {
      await fs.unlink(filePath);
    } catch {
      console.warn("File delete failed:", filePath);
    }
  }

  /* =======================
     ⏰ DATE FORMAT
  ======================= */

  static formatDateTime(date: Date | string): string {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}
