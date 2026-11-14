import crypto from 'crypto';
import { env } from '../config/env';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1; // akceptuj +/- jeden krok czasowy (dryf zegara)

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let secret = '';
  for (const byte of bytes) {
    secret += BASE32_ALPHABET[byte % 32];
  }
  return secret;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '');
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 10 ** TOTP_DIGITS;
  return code.toString().padStart(TOTP_DIGITS, '0');
}

export function verifyTotp(secret: string, token: string): boolean {
  const clean = token.replace(/\s/g, '');
  if (!new RegExp(`^\\d{${TOTP_DIGITS}}$`).test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);
  for (let w = -TOTP_WINDOW; w <= TOTP_WINDOW; w++) {
    if (hotp(secret, counter + w) === clean) return true;
  }
  return false;
}

export function otpauthUrl(email: string, secret: string): string {
  const issuer = env.twoFactorIssuer;
  return (
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}` +
    `&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`
  );
}
