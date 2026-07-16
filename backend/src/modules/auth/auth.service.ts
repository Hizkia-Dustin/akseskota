import { prisma } from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { ApiError } from '../../middlewares/errorHandler';
import { LoginInput, RegisterInput } from './auth.schema';

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

  return issueTokens(user.id, user.role);
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

export function refreshAccessToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    return issueTokens(payload.userId, payload.role);
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
