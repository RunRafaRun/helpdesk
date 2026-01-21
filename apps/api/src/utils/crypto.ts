import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Use a secret key from environment or a default for development
const getSecretKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY || 'helpdesk-default-encryption-key!!'; // 32 chars for AES-256
  // Ensure the key is exactly 32 bytes
  return Buffer.from(key.padEnd(32, '!').slice(0, 32));
};

export function encrypt(text: string): string {
  if (!text) return text;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Not encrypted (legacy data), return as-is
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // If decryption fails, return masked value
    return '••••••••';
  }
}

export function mask(text: string): string {
  if (!text) return '';
  return '••••••••';
}
