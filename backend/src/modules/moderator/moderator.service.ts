import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';

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

  return report;
}

export async function rejectReport(reportId: string, moderatorId: string, note?: string) {
  const report = await updateReportStatus(reportId, 'REJECTED');
  await logModeratorAction(moderatorId, 'reject_report', reportId, { note });

  if (report.targetType === 'OBSTACLE' && report.obstacleId) {
    await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: false } });
  }

  return report;
}

export async function markReportNeedsRecheck(reportId: string, moderatorId: string, note?: string) {
  const report = await updateReportStatus(reportId, 'NEEDS_RECHECK');
  await logModeratorAction(moderatorId, 'needs_recheck_report', reportId, { note });
  if (report.targetType === 'OBSTACLE' && report.obstacleId) {
    await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: false } });
  }
  return report;
}

async function updateReportStatus(reportId: string, status: 'VERIFIED' | 'REJECTED' | 'NEEDS_RECHECK') {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new ApiError(404, 'Laporan tidak ditemukan.');
  return prisma.report.update({ where: { id: reportId }, data: { verificationStatus: status } });
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

  // Move verifications from the duplicate onto the primary report, then
  // mark the duplicate as rejected (merged), preserving history rather
  // than deleting it.
  await prisma.$transaction([
    prisma.verification.updateMany({
      where: { reportId: duplicateReportId },
      data: { reportId: primaryReportId },
    }),
    prisma.report.update({
      where: { id: duplicateReportId },
      data: { verificationStatus: 'REJECTED', description: `[Digabung ke laporan ${primaryReportId}]` },
    }),
  ]);

  await logModeratorAction(moderatorId, 'merge_duplicate', primaryReportId, { duplicateReportId });

  return { primaryReportId, duplicateReportId, merged: true };
}

async function logModeratorAction(userId: string, action: string, entityId: string, meta?: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { userId, action, entity: 'report', entityId, meta: meta as any },
  });
}
