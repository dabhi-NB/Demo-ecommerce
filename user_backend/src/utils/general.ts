import crypto from 'crypto';

/**
 * Generates a random alphanumeric string of specified length.
 * Uses crypto.randomBytes for secure random generation.
 * @param length Length of the random string to generate
 * @return {string} Random alphanumeric string
 */
export function generateRandomAlnum(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    while (result.length < length) {
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < bytes.length && result.length < length; i++) {
            const idx = bytes[i] % chars.length;
            result += chars[idx];
        }
    }
    return result;
}
