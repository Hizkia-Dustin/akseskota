import dotenv from 'dotenv';
dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function positiveInteger(key: string, fallback: string): number {
  const value = Number.parseInt(process.env[key] || fallback, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${key} harus berupa angka bulat positif.`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const uploadStorage = process.env.UPLOAD_STORAGE || (nodeEnv === 'production' ? 'cloudinary' : 'local');
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);
const accessSecret = required('JWT_ACCESS_SECRET');
const refreshSecret = required('JWT_REFRESH_SECRET');

if (!['local', 'cloudinary'].includes(uploadStorage)) {
  throw new Error('UPLOAD_STORAGE harus bernilai "local" atau "cloudinary".');
}

if (uploadStorage === 'cloudinary') {
  required('CLOUDINARY_CLOUD_NAME');
  required('CLOUDINARY_API_KEY');
  required('CLOUDINARY_API_SECRET');
}

if (nodeEnv === 'production') {
  if (accessSecret.length < 32 || refreshSecret.length < 32 || accessSecret === refreshSecret) {
    throw new Error('JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET production harus berbeda dan minimal 32 karakter.');
  }
  if (clientUrls.some((url) => !url.startsWith('https://'))) {
    throw new Error('Seluruh CLIENT_URL production harus menggunakan HTTPS.');
  }
}

export const env = {
  port: positiveInteger('PORT', '4000'),
  nodeEnv,
  clientUrls,
  databaseUrl: required('DATABASE_URL'),
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  uploadStorage,
  reportRateLimit: {
    windowMs: positiveInteger('REPORT_RATE_LIMIT_WINDOW_MS', '3600000'),
    max: positiveInteger('REPORT_RATE_LIMIT_MAX', '10'),
  },
  authRateLimit: {
    windowMs: positiveInteger('AUTH_RATE_LIMIT_WINDOW_MS', '900000'),
    max: positiveInteger('AUTH_RATE_LIMIT_MAX', '20'),
  },
  verificationRateLimit: {
    windowMs: positiveInteger('VERIFICATION_RATE_LIMIT_WINDOW_MS', '3600000'),
    max: positiveInteger('VERIFICATION_RATE_LIMIT_MAX', '60'),
  },
};
