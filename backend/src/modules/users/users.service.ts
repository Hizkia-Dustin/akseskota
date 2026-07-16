import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { UpdatePreferencesInput } from './users.schema';

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
  if (!user) throw new ApiError(404, 'Pengguna tidak ditemukan.');
  return user;
}

// F002: pengguna dapat mengubah mode kapan saja, preferensi tersimpan.
export async function updateMyPreferences(userId: string, input: UpdatePreferencesInput) {
  return prisma.userPreference.upsert({
    where: { userId },
    update: input,
    create: { userId, ...input },
  });
}

// F015: riwayat kontribusi - semua laporan, status verifikasi, total kontribusi
export async function getMyContributions(userId: string) {
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      targetType: true,
      photoUrl: true,
      description: true,
      verificationStatus: true,
      createdAt: true,
    },
  });
  return {
    total: reports.length,
    verified: reports.filter((r) => r.verificationStatus === 'VERIFIED').length,
    reports,
  };
}

// F014: riwayat perjalanan - rute sebelumnya, waktu, mode
export async function getMyRouteHistory(userId: string) {
  return prisma.routeHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
