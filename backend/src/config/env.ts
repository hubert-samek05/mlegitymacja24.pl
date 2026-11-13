import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Brakuje wymaganej zmiennej środowiskowej: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '7000', 10),
  databaseUrl: required('DATABASE_URL'),

  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  qrSigningSecret: required('QR_SIGNING_SECRET'),
  qrTokenTtlSeconds: parseInt(process.env.QR_TOKEN_TTL_SECONDS || '45', 10),

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:7001',
  corsOrigins: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:7001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200', 10),

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'noreply@mlegitymacja24.pl',
  },

  mail: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.MAIL_FROM || 'mLegitymacja24 <powiadomienia@mlegitymacja24.pl>',
    replyTo: process.env.MAIL_REPLY_TO || 'kontakt@mlegitymacja24.pl',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    pmConfig: process.env.STRIPE_PM_CONFIG || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  bank: {
    recipient: process.env.BANK_RECIPIENT || '',
    iban: process.env.BANK_IBAN || '',
    bankName: process.env.BANK_NAME || '',
  },

  trialDays: parseInt(process.env.TRIAL_DAYS || '0', 10),
  billingGraceDays: parseInt(process.env.BILLING_GRACE_DAYS || '7', 10),

  twoFactorIssuer: process.env.TWO_FACTOR_ISSUER || 'mLegitymacja24',
};
