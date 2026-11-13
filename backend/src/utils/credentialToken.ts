import crypto from 'crypto';
import { env } from '../config/env';

// Dynamiczny, podpisany token weryfikacyjny dla kodu QR legitymacji.
// Token wygasa po QR_TOKEN_TTL_SECONDS, co utrudnia wykorzystanie zrzutu ekranu.

export function generateCredentialToken(credentialId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${credentialId}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', env.qrSigningSecret)
    .update(payload)
    .digest('hex');
  const raw = `${payload}.${signature}`;
  return Buffer.from(raw).toString('base64url');
}

export interface TokenVerificationResult {
  valid: boolean;
  credentialId?: string;
  reason?: 'MALFORMED' | 'BAD_SIGNATURE' | 'EXPIRED';
}

export function verifyCredentialToken(token: string): TokenVerificationResult {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'MALFORMED' };
    }
    const [credentialId, timestampStr, signature] = parts;
    const payload = `${credentialId}.${timestampStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.qrSigningSecret)
      .update(payload)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return { valid: false, reason: 'BAD_SIGNATURE' };
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > env.qrTokenTtlSeconds) {
      return { valid: false, credentialId, reason: 'EXPIRED' };
    }

    return { valid: true, credentialId };
  } catch {
    return { valid: false, reason: 'MALFORMED' };
  }
}
