import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { clearRouteSearchCache } from '../routes/routeSearchCache';
import { recomputeRoadSegmentFromVerifiedReports } from '../roadSegments/roadSegments.service';

// F018 - Moderator Verification: Approve / Reject / Merge duplicate.
// Every action is audit-logged (System Architecture section 13).

export async function getVerificationQueue() {
  return prisma.report.findMany({
    where: { verificationStatus: 'UNVERIFIED' },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true } }, obstacle: true, verifications: true },
    take: 100,
  });
}

export async function approveReport(reportId: string, moderatorId: string, note?: string) {
  const report = await updateReportStatus(reportId, 'VERIFIED');
  await logModeratorAction(moderatorId, 'approve_report', reportId, { note });

  // Propagate verification to the underlying entity so it starts
  // influencing routing scores (Accessibility/Comfort/Live Condition).
  if (report.targetType === 'OBSTACLE' && report.obstacleId) {
    await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: true } });
  }
  if (report.targetType === 'ROAD_SEGMENT' && report.roadSegmentId) {
    await recomputeRoadSegmentFromVerifiedReports(report.roadSegmentId);
  }

  clearRouteSearchCache();

  return report;
}

export async function rejectReport(reportId: string, moderatorId: string, note?: string) {
  const report = await updateReportStatus(reportId, 'REJECTED');
  await logModeratorAction(moderatorId, 'reject_report', reportId, { note });

  if (report.targetType === 'OBSTACLE' && report.obstacleId) {
    await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: false } });
  }
  if (report.targetType === 'ROAD_SEGMENT' && report.roadSegmentId) {
    await recomputeRoadSegmentFromVerifiedReports(report.roadSegmentId);
  }

  clearRouteSearchCache();

  return report;
}

export async function markReportNeedsRecheck(reportId: string, moderatorId: string, note?: string) {
  const report = await updateReportStatus(reportId, 'NEEDS_RECHECK');
  await logModeratorAction(moderatorId, 'needs_recheck_report', reportId, { note });
  if (report.targetType === 'OBSTACLE' && report.obstacleId) {
    await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: false } });
  }
  if (report.targetType === 'ROAD_SEGMENT' && report.roadSegmentId) {
    await recomputeRoadSegmentFromVerifiedReports(report.roadSegmentId);
  }
  clearRouteSearchCache();
  return report;
}

async function updateReportStatus(reportId: string, status: 'VERIFIED' | 'REJECTED' | 'NEEDS_RECHECK') {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new ApiError(404, 'Laporan tidak ditemukan.');
  return prisma.report.update({ where: { id: reportId }, data: { verificationStatus: status } });
}

export async function getModeratorDashboardSummary() {
  const [pendingReports, verifiedReports, rejectedReports, activeObstacles, totalUsers] = await Promise.all([
    prisma.report.count({ where: { verificationStatus: 'UNVERIFIED' } }),
    prisma.report.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.report.count({ where: { verificationStatus: 'REJECTED' } }),
    prisma.obstacle.count({ where: { isActive: true } }),
    prisma.user.count(),
  ]);

  return {
    pendingReports,
    verifiedReports,
    rejectedReports,
    activeObstacles,
    totalUsers,
  };
}

export async function mergeDuplicateReports(primaryReportId: string, duplicateReportId: string, moderatorId: string) {
  if (primaryReportId === duplicateReportId) {
    throw new ApiError(422, 'Laporan utama dan duplikat tidak boleh sama.');
  }

  const [primary, duplicate] = await Promise.all([
    prisma.report.findUnique({ where: { id: primaryReportId } }),
    prisma.report.findUnique({ where: { id: duplicateReportId } }),
  ]);
  if (!primary || !duplicate) throw new ApiError(404, 'Salah satu laporan tidak ditemukan.');
  if (primary.targetType !== duplicate.targetType) {
    throw new ApiError(422, 'Laporan dengan jenis target berbeda tidak dapat digabungkan.');
  }

  // Upsert each vote to avoid violating the unique(reportId,userId)
  // constraint when a user voted on both reports.
  await prisma.$transaction(async (transaction) => {
    const duplicateVotes = await transaction.verification.findMany({ where: { reportId: duplicateReportId } });
    for (const vote of duplicateVotes) {
      await transaction.verification.upsert({
        where: { reportId_userId: { reportId: primaryReportId, userId: vote.userId } },
        update: { action: vote.action, note: vote.note },
        create: { reportId: primaryReportId, userId: vote.userId, action: vote.action, note: vote.note },
      });
    }
    await transaction.verification.deleteMany({ where: { reportId: duplicateReportId } });
    await transaction.report.update({
      where: { id: duplicateReportId },
      data: { verificationStatus: 'REJECTED', description: `[Digabung ke laporan ${primaryReportId}]` },
    });
    if (duplicate.obstacleId) {
      await transaction.obstacle.update({ where: { id: duplicate.obstacleId }, data: { isActive: false } });
    }
  });

  await logModeratorAction(moderatorId, 'merge_duplicate', primaryReportId, { duplicateReportId });
  clearRouteSearchCache();

  return { primaryReportId, duplicateReportId, merged: true };
}

async function logModeratorAction(userId: string, action: string, entityId: string, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { userId, action, entity: 'report', entityId, meta: meta as any },
  });
}
