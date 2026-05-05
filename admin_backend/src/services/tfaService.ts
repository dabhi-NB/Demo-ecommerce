import Admin, { IUser } from '../models/adminModel';
import { GeneralHelper } from '../utils/general';
import crypto from 'crypto';

type AdminDoc = IUser & { _id: any };

export class TfaService {
  /**
   * Generate a 6-digit OTP
   */
  generateOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  /**
   * Encrypt a string (base64)
   */
  encryptCode(value: string): string {
    return Buffer.from(value).toString('base64');
  }

  /**
   * Decrypt a string (base64)
   */
  decryptCode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

     /**
     * Send OTP email
     */
   async sendOtp(user: AdminDoc) {
    const otp = this.generateOtp(); // 6-digit OTP
    const expiresAt = Math.floor(Date.now() / 1000) * 60; // 10 minutes
    // Save OTP + expiry in a single field
    await Admin.findByIdAndUpdate(user._id, {
      otp: `${otp}_${expiresAt}`,
      otp_failed: 0,
      updated_at: new Date(),
    });

    console.log('🔐 OTP GENERATED:', otp, 'EXPIRES AT:', expiresAt);

    // Send OTP via email
    await GeneralHelper.sendEmail(user.email!, 'otp', {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      otp,
      message: 'Verify your account',
    });

    return { status: 1, message: 'OTP sent successfully' };
  }

  /**
   * Check OTP validity
   */
  checkOtp(otp: number | string, storedOtp: string | null | undefined) {
    if (!storedOtp) {
      return { status: 0, message: 'OTP is invalid or expired' };
    }

    // Split stored OTP into code + expiry
    const [storedOtpCode, storedTimestamp] = storedOtp.split('_').map(Number);

    // Validate OTP
    if (storedOtpCode !== Number(otp)) {
      return { status: 0, message: 'OTP is invalid' };
    }

    // Check expiry
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > storedTimestamp) {
      return { status: 0, message: 'OTP has expired' };
    }

    return { status: 1, message: 'OTP verified successfully' };
  }


  /**
   * Generate a TOTP secret key
   */
  generateTotpSecretKey(length = 16): string {
    const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < length; i++) {
      secret += validChars[Math.floor(Math.random() * validChars.length)];
    }
    return secret;
  }

  /**
   * Generate a TOTP code
   */
  getTotpCode(secret: string, timeSlice?: number): string {
    if (!timeSlice) timeSlice = Math.floor(Date.now() / 1000 / 30);

    const decoded = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0); // high 4 bytes
    buffer.writeUInt32BE(timeSlice, 4); // low 4 bytes

    const hmac = crypto.createHmac('sha1', decoded).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString();

    return code.padStart(6, '0');
  }

  /**
   * Verify TOTP code
   */
  verifyTotp(secret: string, code: string, discrepancy = 1): boolean {
    const timeSlice = Math.floor(Date.now() / 1000 / 30);
    for (let i = -discrepancy; i <= discrepancy; i++) {
      if (this.getTotpCode(secret, timeSlice + i) === code) {
        return true;
      }
    }
    return false;
  }

  /**
   * Base32 decode
   */
  base32Decode(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    input = input.toUpperCase().replace(/[^A-Z2-7]/g, '');

    for (const char of input) {
      bits += alphabet.indexOf(char).toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }

    return Buffer.from(bytes);
  }

  /**
   * Toggle 2FA
   */
  async tfaStatusChange(user: AdminDoc) {
    user.status_tfa = user.status_tfa ? 0 : 1;
    await user.save();
    return {
      status: 1,
      message: user.status_tfa
        ? 'Two Factor Authentication is enabled'
        : 'Two Factor Authentication is disabled',
    };
  }
  
  
    static async revokeAll2FADevices(userId: string) {
    const user = await Admin.findById(userId);

    if (!user) {
      return {
        status: 0,
        message: "User not found",
      };
    }

    // clear trusted devices
     user.ignore_tfa_device = undefined;

    await user.save();

    return {
      status: 1,
      message: "All trusted devices revoked successfully",
    };
  }
}
