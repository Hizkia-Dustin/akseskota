import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';

// F020 - Admin Panel: mengelola User, Reports, Categories, Statistics.

export async function listUsers(role?: string) {
  return prisma.user.findMany({
    where: role ? { role: role as any } : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateUserRole(userId: string, role: 'USER' | 'MODERATOR' | 'ADMIN') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Pengguna tidak ditemukan.');
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Pengguna tidak ditemukan.');
  await prisma.user.delete({ where: { id: userId } });
  return { deleted: true };
}

// System-wide statistics for the admin dashboard.
export async function getSystemStatistics() {
  const [userCount, reportCount, verifiedReportCount, obstacleCount, roadSegmentCount, facilityCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.report.count(),
      prisma.report.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.obstacle.count({ where: { isActive: true } }),
      prisma.roadSegment.count(),
      prisma.facility.count(),
    ]);

  return {
    users: userCount,
    reports: { total: reportCount, verified: verifiedReportCount },
    activeObstacles: obstacleCount,
    roadSegments: roadSegmentCount,
    facilities: facilityCount,
  };
}
