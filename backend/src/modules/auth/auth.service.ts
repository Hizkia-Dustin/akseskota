import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../middlewares/errorHandler';
import { LoginInput, RegisterInput } from './auth.schema';
import { env } from '../../config/env';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { randomUUID } from 'node:crypto';

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
  if (!env.firebase.projectId || !env.firebase.clientEmail || !env.firebase.privateKey) {
    throw new ApiError(503, 'Login Google belum dikonfigurasi di backend.');
  }

  const firebaseApp = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });

  let decodedToken;
  try {
    decodedToken = await getAuth(firebaseApp).verifyIdToken(idToken);
  } catch {
    throw new ApiError(401, 'Token Google tidak valid atau kedaluwarsa.');
  }

  if (!decodedToken.email || !decodedToken.email_verified) {
    throw new ApiError(401, 'Email Google belum terverifikasi.');
  }

  let user = await prisma.user.findUnique({ where: { email: decodedToken.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: decodedToken.name || decodedToken.email.split('@')[0],
        email: decodedToken.email,
        passwordHash: await hashPassword(`google:${decodedToken.uid}:${randomUUID()}`),
        preferences: { create: {} },
      },
    });
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...issueTokens(user.id, user.role),
  };
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
