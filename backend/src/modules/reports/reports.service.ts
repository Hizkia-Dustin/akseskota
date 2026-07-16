import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { CreateReportInput } from './reports.schema';

export async function createReport(
  input: CreateReportInput & {
    userId: string;
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
  return prisma.report.findMany({
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

  return report;
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

  return prisma.verification.create({
    data: {
      reportId,
      userId,
      action,
      note,
    },
  });
}