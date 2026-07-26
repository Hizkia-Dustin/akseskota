import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { UpdateProfileInput } from './profile.schema';

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      preferences: true,
      _count: { select: { reports: true, routeHistory: true } },
    },
  });

  if (!user) {
    throw new ApiError(404, 'Pengguna tidak ditemukan.');
  }

  return user;
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Pengguna tidak ditemukan.');

  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}
