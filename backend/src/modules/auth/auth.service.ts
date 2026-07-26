import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../middlewares/errorHandler';
import { LoginInput, RegisterInput } from './auth.schema';
import { env } from '../../config/env';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';
import { decode as decodeJwt, JwtPayload, verify as verifyJwt } from 'jsonwebtoken';

const FIREBASE_CERTIFICATES_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedFirebaseCertificates: Record<string, string> | null = null;
let firebaseCertificatesExpireAt = 0;

type FirebaseIdentity = {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'Email sudah terdaftar.');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      preferences: { create: {} }, // default GENERAL mode, F002
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return {
    user,
    ...issueTokens(user.id, user.role),
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, 'Email atau password salah.');
  }
  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, 'Email atau password salah.');
  }
  const tokens = issueTokens(user.id, user.role);
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function googleUser(idToken: string) {
  if (!env.firebase.projectId) {
    throw new ApiError(503, 'Login Google belum dikonfigurasi di backend.');
  }

  let identity: FirebaseIdentity;
  try {
    identity = await verifyFirebaseIdentity(idToken);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Token Google tidak valid atau kedaluwarsa.');
  }

  if (!identity.emailVerified) {
    throw new ApiError(401, 'Email Google belum terverifikasi.');
  }

  let user = await prisma.user.findUnique({ where: { email: identity.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: identity.name || identity.email.split('@')[0],
        email: identity.email,
        passwordHash: await hashPassword(`google:${identity.uid}:${randomUUID()}`),
        preferences: { create: {} },
      },
    });
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...issueTokens(user.id, user.role),
  };
}

async function verifyFirebaseIdentity(idToken: string): Promise<FirebaseIdentity> {
  if (env.firebase.clientEmail && env.firebase.privateKey) {
    const firebaseApp = getApps()[0] ?? initializeApp({
      credential: cert({
        projectId: env.firebase.projectId,
        clientEmail: env.firebase.clientEmail,
        privateKey: env.firebase.privateKey,
      }),
    });
    const token = await getAuth(firebaseApp).verifyIdToken(idToken);
    if (!token.email) throw new Error('Firebase token does not contain an email.');
    return {
      uid: token.uid,
      email: token.email,
      emailVerified: Boolean(token.email_verified),
      name: token.name,
    };
  }

  const decoded = decodeJwt(idToken, { complete: true });
  if (
    !decoded
    || typeof decoded === 'string'
    || decoded.header.alg !== 'RS256'
    || typeof decoded.header.kid !== 'string'
  ) {
    throw new Error('Invalid Firebase token header.');
  }

  const certificates = await getFirebaseCertificates();
  const certificate = certificates[decoded.header.kid];
  if (!certificate) throw new Error('Unknown Firebase signing certificate.');

  const payload = verifyJwt(idToken, certificate, {
    algorithms: ['RS256'],
    audience: env.firebase.projectId,
    issuer: `https://securetoken.google.com/${env.firebase.projectId}`,
  }) as JwtPayload;

  if (
    typeof payload.sub !== 'string'
    || !payload.sub
    || typeof payload.email !== 'string'
  ) {
    throw new Error('Firebase token payload is incomplete.');
  }

  return {
    uid: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

async function getFirebaseCertificates(): Promise<Record<string, string>> {
  if (cachedFirebaseCertificates && Date.now() < firebaseCertificatesExpireAt) {
    return cachedFirebaseCertificates;
  }

  let response: Response;
  try {
    response = await fetch(FIREBASE_CERTIFICATES_URL);
  } catch {
    throw new ApiError(503, 'Layanan verifikasi Google sedang tidak dapat dijangkau.');
  }
  if (!response.ok) {
    throw new ApiError(503, 'Sertifikat verifikasi Google tidak dapat dimuat.');
  }

  const certificates = await response.json() as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeSeconds = Number.parseInt(cacheControl.match(/max-age=(\d+)/)?.[1] || '3600', 10);
  cachedFirebaseCertificates = certificates;
  firebaseCertificatesExpireAt = Date.now() + Math.max(300, maxAgeSeconds) * 1000;
  return certificates;
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });
    if (!user) throw new Error('User not found');
    return issueTokens(user.id, user.role);
  } catch {
    throw new ApiError(401, 'Refresh token tidak valid atau kedaluwarsa.');
  }
}

function issueTokens(userId: string, role: 'USER' | 'MODERATOR' | 'ADMIN') {
  return {
    accessToken: signAccessToken({ userId, role }),
    refreshToken: signRefreshToken({ userId, role }),
  };
}
