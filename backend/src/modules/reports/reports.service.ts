import { prisma } from '../../config/prisma';
import { randomBytes } from 'crypto';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateReportInput } from './reports.schema';
import { clearRouteSearchCache } from '../routes/routeSearchCache';

export async function createReport(
  input: CreateReportInput & {
    userId?: string;
    photoUrl: string;
  },
) {
  // Validasi target sesuai targetType
  switch (input.targetType) {
    case 'ROAD_SEGMENT':
      if (!input.roadSegmentId) {
        throw new ApiError(400, 'roadSegmentId wajib diisi.');
      }
      break;

    case 'OBSTACLE':
      if (!input.obstacleId) {
        throw new ApiError(400, 'obstacleId wajib diisi.');
      }
      break;

    case 'FACILITY':
      if (!input.facilityId) {
        throw new ApiError(400, 'facilityId wajib diisi.');
      }
      break;
  }

  return prisma.report.create({
    data: {
      userId: input.userId,
      guestAccessKey: input.userId ? undefined : randomBytes(24).toString('hex'),
      title: input.title,

      targetType: input.targetType,

      roadSegmentId: input.roadSegmentId,

      obstacleId: input.obstacleId,

      facilityId: input.facilityId,

      photoUrl: input.photoUrl,

      description: input.description,

      verificationStatus: 'UNVERIFIED',
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function listReports(filters: {
  status?: string;
  targetType?: string;
}) {
  const reports = await prisma.report.findMany({
    where: {
      verificationStatus: filters.status as any,
      targetType: filters.targetType as any,
    },

    orderBy: {
      createdAt: 'desc',
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },

      _count: {
        select: {
          verifications: true,
        },
      },
    },

    take: 100,
  });

  return reports.map(({ guestAccessKey: privateGuestAccessKey, ...report }) => {
    void privateGuestAccessKey;
    return report;
  });
}

export async function getReportById(id: string) {
  const report = await prisma.report.findUnique({
    where: {
      id,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },

      verifications: {
        orderBy: {
          createdAt: 'desc',
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },

      roadSegment: true,
      obstacle: true,
      facility: true,
    },
  });

  if (!report) {
    throw new ApiError(404, 'Laporan tidak ditemukan.');
  }

  const { guestAccessKey: privateGuestAccessKey, ...publicReport } = report;
  void privateGuestAccessKey;
  return publicReport;
}

export async function submitCommunityVerification(
  reportId: string,
  userId: string,
  action: 'VERIFIED' | 'REJECTED' | 'NEEDS_RECHECK',
  note?: string,
) {
  const report = await prisma.report.findUnique({
    where: {
      id: reportId,
    },
  });

  if (!report) {
    throw new ApiError(404, 'Laporan tidak ditemukan.');
  }

  if (report.verificationStatus === 'REJECTED') {
    throw new ApiError(409, 'Laporan yang sudah ditolak tidak dapat diverifikasi kembali.');
  }

  if (report.userId === userId) {
    throw new ApiError(422, 'Pelapor tidak dapat memverifikasi laporannya sendiri.');
  }

  const verification = await prisma.verification.upsert({
    where: { reportId_userId: { reportId, userId } },
    update: { action, note },
    create: { reportId, userId, action, note },
  });

  const grouped = await prisma.verification.groupBy({
    by: ['action'],
    where: { reportId },
    _count: { action: true },
  });
  const votes = Object.fromEntries(grouped.map((item) => [item.action, item._count.action])) as Record<string, number>;
  const threshold = 3;

  let status = report.verificationStatus;
  if ((votes.VERIFIED || 0) >= threshold && report.verificationStatus !== 'VERIFIED') {
    status = 'VERIFIED';
    await prisma.report.update({ where: { id: reportId }, data: { verificationStatus: 'VERIFIED' } });
    if (report.obstacleId) await prisma.obstacle.update({ where: { id: report.obstacleId }, data: { isActive: true } });
    clearRouteSearchCache();
  } else if (((votes.NEEDS_RECHECK || 0) >= threshold || (votes.REJECTED || 0) >= threshold) && report.verificationStatus === 'UNVERIFIED') {
    status = 'NEEDS_RECHECK';
    await prisma.report.update({ where: { id: reportId }, data: { verificationStatus: 'NEEDS_RECHECK' } });
  }

  return { verification, consensus: { threshold, votes, status } };
}

export async function listMapReports() {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT r.id, r.title, r.description, r.photoUrl AS photo_url,
            r.verificationStatus AS verification_status, r.createdAt AS created_at,
            o.type AS obstacle_type, o.status AS obstacle_status,
            ST_AsGeoJSON(o.geometry) AS geometry
     FROM reports r
     JOIN obstacles o ON o.id = r.obstacleId
     WHERE r.targetType = 'OBSTACLE'
       AND r.verificationStatus IN ('UNVERIFIED', 'VERIFIED', 'NEEDS_RECHECK')
       AND (r.expiresAt IS NULL OR r.expiresAt > NOW())
       AND (o.expiresAt IS NULL OR o.expiresAt > NOW())
       AND o.geometry IS NOT NULL
     ORDER BY r.createdAt DESC
     LIMIT 500`,
  )) as Array<{
    id: string;
    title: string;
    description: string | null;
    photo_url: string;
    verification_status: string;
    created_at: Date;
    obstacle_type: string;
    obstacle_status: string;
    geometry: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    photoUrl: row.photo_url,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    obstacleType: row.obstacle_type,
    obstacleStatus: row.obstacle_status,
    geometry: JSON.parse(row.geometry),
  }));
}

export async function getGuestReport(accessKey: string) {
  const report = await prisma.report.findUnique({
    where: { guestAccessKey: accessKey },
    select: {
      id: true,
      title: true,
      description: true,
      photoUrl: true,
      verificationStatus: true,
      createdAt: true,
      obstacle: { select: { type: true, status: true } },
    },
  });
  if (!report) throw new ApiError(404, 'Laporan guest tidak ditemukan.');
  return report;
}
