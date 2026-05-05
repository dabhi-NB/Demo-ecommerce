import bcrypt from 'bcryptjs';

export function encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export function checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}