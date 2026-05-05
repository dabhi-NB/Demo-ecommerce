import { Request } from "express";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";
import { getSetting, getAllSettings } from "../utils/settingsHelper";
import { getEmailTemplateByKey } from "../models/EmailTemplateModel";
import { renderEmailLayout } from "./emailLayout";


interface IpData {
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface ServiceResponse {
  status: number;
  message: string;
  data?: any;
  http_status?: number;
}

interface FileUploadResult {
  status: number;
  message: string;
  file_name?: string;
  file_type?: string;
  size?: number;
  name?: string;
  extension?: string;
}

export class GeneralHelper {
  static getClientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "127.0.0.1";
  }

  static async getIpData(ip: string, req?: Request): Promise<string | null> {
    try {
      if (!ip && req) {
        ip = this.getClientIp(req);
      }
      if (!ip) return null;

      const response = await axios.get(
        `https://api.ipinfo.io/${ip}`,
        { timeout: 2000 }
      );
      return JSON.stringify(response.data);
    } catch (error) {
      return null;
    }
  }

  static async getIpInfo(
    ip: string = "",
    req?: Request
  ): Promise<IpData | null> {
    try {
      const ipData = await this.getIpData(ip, req);
      if (!ipData) return null;

      const parsed = JSON.parse(ipData);
      return {
        city: parsed.city || null,
        region: parsed.region || null,
        country: parsed.country || parsed.country_name || null,
        latitude: parsed.latitude || null,
        longitude: parsed.longitude || null,
      };
    } catch (error) {
      return null;
    }
  }
  static async getIpLocation(ip: string = "", req?: Request): Promise<string> {
    try {
      // 🔒 Local / private IPs skip (VERY IMPORTANT)
      if (!ip || ip === "127.0.0.1" || ip === "::1") {
        return "-";
      }

      const ipInfo = await this.getIpInfo(ip, req);
      if (!ipInfo) return "-";

      const parts = [ipInfo.city, ipInfo.region, ipInfo.country].filter(
        Boolean
      );
      return parts.length ? parts.join(", ") : "-";
    } catch {
      // ❗ Never throw, never block
      return "-";
    }
  }

  static async getIpInfoCountry(ip: string, req?: Request): Promise<string> {
    try {
      if (!ip && req) {
        ip = this.getClientIp(req);
      }
      if (!ip) return "";

      const response = await axios.get(
        `https://api.ipinfo.io/${ip}/country`,
        { timeout: 5000 }
      );
      return response.data;
    } catch (error) {
      return "";
    }
  }

  static async recaptchaFails(
    req: Request,
    secretKey: string
  ): Promise<boolean> {
    // Only use before OTP send (step 1), not after OTP form
    if (!secretKey) return false;

    const token =
      req.body["g-recaptcha-response"] ||
      req.body.recaptcha ||
      req.body.captcha;

    if (!token) {
      return true;
    }

    try {
      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
          timeout: 5000,
        }
      );

      if (response.data?.success !== true) {
        return true;
      }

      return false;
    } catch (error) {
      // Use console.error instead of logger to avoid TS2304 error
      console.error("Recaptcha verification error:", error);
      return true;
    }
  }

  static deviceName(userAgent: string): string {
    if (!userAgent) return "";

    const browserMatch = userAgent.match(
      /(Chrome|Firefox|Safari|Opera|Edge|MSIE|Trident)\/?\s*(\d+)/
    );
    const osMatch = userAgent.match(/(Windows|Mac OS|Linux|Android|iOS)/);

    const browser = browserMatch ? browserMatch[1] : "Unknown Browser";
    const os = osMatch ? osMatch[1] : "Unknown OS";

    return `${browser} on ${os}`;
  }

  static slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  static formatResponse(response: ServiceResponse): {
    status: number;
    message: string;
    data: any;
  } {
    return {
      status: response.status,
      message: response.message,
      data: response.data || [],
    };
  }

  static getFilePath(type: string = "profile"): string {
    const paths: { [key: string]: string } = {
      profile: "uploads/profile/",
      email: "uploads/email/",
      logo: "uploads/logo/",
      temp: "uploads/temp/",
    };
    return paths[type] || paths.temp;
  }

  static getNoFileUrl(type: string = "setting"): string {
    return "/assets/no-image.jpg";
  }

  static getFileUrl(fileName: string | null, type: string = "profile"): string {
    if (!fileName) return this.getNoFileUrl(type);

    const filePath = this.getFilePath(type);
    const fullPath = path.join(process.cwd(), "public", filePath, fileName);

    if (fs.existsSync(fullPath)) {
      return `/${filePath}${fileName}`;
    }

    return this.getNoFileUrl(type);
  }

  static deleteFile(fileName: string | null, type: string = "profile"): void {
    if (!fileName) return;

    const filePath = this.getFilePath(type);
    const fullPath = path.join(process.cwd(), "public", filePath, fileName);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  static uploadFile(
    file: Express.Multer.File,
    type: string = "profile",
    subDir: string = "",
    customName: string = ""
  ): FileUploadResult {
    try {
      const fileDir = this.getFilePath(type);
      let uploadPath = path.join(process.cwd(), "public", fileDir);

      if (subDir) {
        if (subDir === "date") {
          const now = new Date();
          subDir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        }
        uploadPath = path.join(uploadPath, subDir);
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      let fileName: string;
      if (customName === "same") {
        fileName = file.originalname;
      } else if (customName) {
        fileName = customName;
      } else {
        const randomString = this.randomString(32);
        const ext = path.extname(file.originalname);
        fileName = `${randomString}${ext}`;
      }

      const finalPath = path.join(uploadPath, fileName);
      fs.writeFileSync(finalPath, file.buffer);

      const relativePath = subDir ? `${subDir}/${fileName}` : fileName;

      return {
        status: 1,
        message: "File uploaded successfully",
        file_name: relativePath,
        file_type: file.mimetype,
        size: file.size,
        name: file.originalname,
        extension: path.extname(file.originalname).substring(1),
      };
    } catch (error) {
      return {
        status: 0,
        message: error instanceof Error ? error.message : "File upload failed",
      };
    }
  }

  static getTimezoneList(): { [key: string]: string } {
    return JSON.parse(
      '{"Pacific/Midway":"(UTC-11:00) Pacific/Midway","US/Samoa":"(UTC-11:00) US/Samoa","US/Hawaii":"(UTC-10:00) US/Hawaii","US/Alaska":"(UTC-09:00) US/Alaska","US/Pacific":"(UTC-08:00) US/Pacific","America/Tijuana":"(UTC-08:00) America/Tijuana","US/Arizona":"(UTC-07:00) US/Arizona","US/Mountain":"(UTC-07:00) US/Mountain","America/Chihuahua":"(UTC-07:00) America/Chihuahua","America/Mazatlan":"(UTC-07:00) America/Mazatlan","America/Mexico_City":"(UTC-06:00) America/Mexico_City","America/Monterrey":"(UTC-06:00) America/Monterrey","Canada/Saskatchewan":"(UTC-06:00) Canada/Saskatchewan","US/Central":"(UTC-06:00) US/Central","US/Eastern":"(UTC-05:00) US/Eastern","US/East-Indiana":"(UTC-05:00) US/East-Indiana","America/Bogota":"(UTC-05:00) America/Bogota","America/Lima":"(UTC-05:00) America/Lima","America/Caracas":"(UTC-04:30) America/Caracas","Canada/Atlantic":"(UTC-04:00) Canada/Atlantic","America/La_Paz":"(UTC-04:00) America/La_Paz","America/Santiago":"(UTC-04:00) America/Santiago","Canada/Newfoundland":"(UTC-03:30) Canada/Newfoundland","America/Buenos_Aires":"(UTC-03:00) America/Buenos_Aires","Greenland":"(UTC-03:00) Greenland","Atlantic/Stanley":"(UTC-02:00) Atlantic/Stanley","Atlantic/Azores":"(UTC-01:00) Atlantic/Azores","Atlantic/Cape_Verde":"(UTC-01:00) Atlantic/Cape_Verde","Africa/Casablanca":"(UTC) Africa/Casablanca","Europe/Dublin":"(UTC) Europe/Dublin","Europe/Lisbon":"(UTC) Europe/Lisbon","Europe/London":"(UTC) Europe/London","Africa/Monrovia":"(UTC) Africa/Monrovia","Europe/Amsterdam":"(UTC+01:00) Europe/Amsterdam","Europe/Belgrade":"(UTC+01:00) Europe/Belgrade","Europe/Berlin":"(UTC+01:00) Europe/Berlin","Europe/Paris":"(UTC+01:00) Europe/Paris","Europe/Rome":"(UTC+01:00) Europe/Rome","Europe/Athens":"(UTC+02:00) Europe/Athens","Europe/Istanbul":"(UTC+02:00) Europe/Istanbul","Asia/Jerusalem":"(UTC+02:00) Asia/Jerusalem","Asia/Baghdad":"(UTC+03:00) Asia/Baghdad","Asia/Riyadh":"(UTC+03:00) Asia/Riyadh","Europe/Moscow":"(UTC+03:00) Europe/Moscow","Asia/Tehran":"(UTC+03:30) Asia/Tehran","Asia/Dubai":"(UTC+04:00) Asia/Dubai","Asia/Kabul":"(UTC+04:30) Asia/Kabul","Asia/Karachi":"(UTC+05:00) Asia/Karachi","Asia/Kolkata":"(UTC+05:30) Asia/Kolkata","Asia/Kathmandu":"(UTC+05:45) Asia/Kathmandu","Asia/Dhaka":"(UTC+06:00) Asia/Dhaka","Asia/Bangkok":"(UTC+07:00) Asia/Bangkok","Asia/Singapore":"(UTC+08:00) Asia/Singapore","Asia/Hong_Kong":"(UTC+08:00) Asia/Hong_Kong","Asia/Tokyo":"(UTC+09:00) Asia/Tokyo","Australia/Adelaide":"(UTC+09:30) Australia/Adelaide","Australia/Sydney":"(UTC+10:00) Australia/Sydney","Pacific/Auckland":"(UTC+12:00) Pacific/Auckland","Pacific/Fiji":"(UTC+12:00) Pacific/Fiji"}'
    );
  }

  static getClientTimezone(req: Request): string {
    const defaultTimezone = process.env.APP_TIMEZONE || "UTC";
    const cookieName = `${process.env.APP_UID || "app"}_tz`;
    const tz = req.cookies?.[cookieName];

    if (!tz) return defaultTimezone;

    const tzMap: { [key: string]: string } = {
      "Asia/Calcutta": "Asia/Kolkata",
      "Asia/Katmandu": "Asia/Kathmandu",
      "US/Eastern": "America/New_York",
      "US/Central": "America/Chicago",
      "US/Pacific": "America/Los_Angeles",
      "US/Mountain": "America/Denver",
    };

    return tzMap[tz] || tz;
  }

  static dateFormat(
    date: Date | string | number,
    includeTime: boolean = true,
    format: string = ""
  ): string {
    try {
      let dateObj: Date;

      if (typeof date === "number") {
        dateObj = new Date(date);
      } else if (typeof date === "string") {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }

      if (!format) {
        format = includeTime ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD";
      }

      const pad = (num: number) => String(num).padStart(2, "0");

      return format
        .replace("YYYY", String(dateObj.getFullYear()))
        .replace("MM", pad(dateObj.getMonth() + 1))
        .replace("DD", pad(dateObj.getDate()))
        .replace("HH", pad(dateObj.getHours()))
        .replace("mm", pad(dateObj.getMinutes()))
        .replace("ss", pad(dateObj.getSeconds()));
    } catch (error) {
      return "";
    }
  }

  static currentTime(format: string = "YYYY-MM-DD HH:mm:ss"): string {
    return this.dateFormat(new Date(), true, format);
  }

  static dateUTC(
    date: string | Date,
    includeTime: boolean = true,
    format: string = "YYYY-MM-DD HH:mm:ss"
  ): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return this.dateFormat(dateObj, includeTime, format);
  }

  static async verifyEmail(email: string): Promise<ServiceResponse> {
    try {
      const response = await axios.post(
        "https://verify.maileroo.net/check",
        {
          api_key:
            "375df02c16af6b78a9131cf6ba190d9444423a101843232680ba3434e0c4d9c1",
          email_address: email,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        }
      );

      const data = response.data;
      if (data.success?.data) {
        const emailData = data.success.data;

        if (!emailData.format_valid) {
          return { status: 0, message: "Email format is not valid" };
        }
        if (!emailData.mx_found) {
          return { status: 0, message: "Email is not valid" };
        }
        if (emailData.disposable) {
          return { status: 0, message: "Email is not allowed" };
        }
      }

      return { status: 1, message: "Email is valid" };
    } catch (error) {
      return { status: 1, message: "Email is valid" };
    }
  }

  static getError(error: any): string {
    if (error?.details && error.details.length > 0) {
      return error.details[0].message;
    }
    return "Something went wrong";
  }

  static randomString(length: number = 32): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === "object" && Object.keys(value).length === 0)
    );
  }

  static async sendEmail(
    to: string,
    template: string,
    data: any,
    queue: boolean = false
  ): Promise<{ status: number; message: string }> {
    try {
      // 🔥 Normalize email data (REQUIRED for all templates)
      const settings = await getAllSettings();

      data = {
        app_name: settings["setting.app_name"] || process.env.APP_NAME || "App",

        first_name: data?.first_name || data?.user?.first_name || "",
        last_name: data?.last_name || data?.user?.last_name || "",
        email: data?.email || data?.user?.email || "",

        ...data,
      };

      // 'template' argument should be the email_template key, e.g., 'otp'
      const templateData = await this.getEmailTemplate(template, data);

      if (!templateData) {
        return { status: 0, message: "Email template not found" };
      }

      if (!templateData.subject || !templateData.subject.trim()) {
        templateData.subject = "Notification";
      }

      if (queue) {
        return { status: 1, message: "Email dispatched to queue" };
      }

      return await GeneralHelper.sendEmailSMTP(
        to,
        templateData.subject,
        templateData.body
      );
    } catch (error: any) {
      console.error("GeneralHelper.sendEmail error:", error);
      return {
        status: 0,
        message:
          error.message ||
          "An unexpected error occurred. Please try again later.",
      };
    }
  }

  static async sendEmailSMTP(
    to: string,
    subject: string,
    body: string
  ): Promise<{ status: number; message: string }> {
    try {
      // Fetch SMTP settings
      const settings = await getAllSettings();
      const smtpHost = settings["mail.mailers.smtp.host"];
      const smtpPort = Number(settings["mail.mailers.smtp.port"]) || 587;
      const smtpEncryption = settings["mail.mailers.smtp.encryption"];
      const smtpUser = settings["mail.mailers.smtp.username"];
      const smtpPass = settings["mail.mailers.smtp.password"];
      const mailFrom = settings["mail.from.address"];
      const mailFromName = settings["mail.from.name"];
      const sitename = settings["setting.app_name"];
      const sitelogo = settings["setting.app_logo"];

      // Validate required settings
      if (!smtpHost || !smtpUser || !smtpPass) {
        return { status: 0, message: "SMTP configuration incomplete" };
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: (smtpEncryption || "").toLowerCase() === "ssl",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // Verify connection
      try {
        await transporter.verify();
      } catch (verifyError: any) {
        return { status: 0, message: `SMTP verification failed: ${verifyError.message}` };
      }

      const htmlContent = await renderEmailLayout(body, sitename || "App", sitelogo ? `${sitelogo}` : sitename);

      const mailOptions = {
        from: `"${mailFromName || "App"}" <${mailFrom}>`,
        to,
        subject,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);

      return { status: 1, message: "Email sent successfully" };
    } catch (error: any) {
      console.error(`❌ SMTP Error - Failed to send email to ${to}:`, error);
      console.error("❌ SMTP Error - Details:", {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      return { status: 0, message: error.message || "Failed to send email" };
    }
  }

  static async getEmailTemplate(
    template: string,
    data: any
  ): Promise<{ subject: string; body: string } | null> {
    const templateObj = await getEmailTemplateByKey(template, data);
    if (!templateObj) {
      console.warn("getEmailTemplate: No template found for key:", template);
      return null;
    }
    return templateObj;
  }

  static getAuthRedirectUrl(redirectUrl?: string, req?: any): string {
    let sessionRedirectUrl = req?.session?.auth_redirect_url;
    if (sessionRedirectUrl) {
      redirectUrl = sessionRedirectUrl;
      if (req?.session) {
        delete req.session.auth_redirect_url;
      }
    }
    return redirectUrl || "/";
  }
}
