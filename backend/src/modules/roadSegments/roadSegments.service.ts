import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { findRoadSegmentsNear, insertRoadSegmentGeometry } from '../../utils/spatial';
import { AddRoadSegmentInput } from './roadSegments.schema';

// F011 - Tambah Kondisi Jalur.
// Creates the road_segment record AND a linked Report (photo mandatory,
// timestamp automatic, verification pending) so it flows into the same
// moderation queue as obstacle reports (F013/F018).
export async function addRoadSegmentCondition(
  userId: string,
  input: AddRoadSegmentInput,
  photoUrl: string | undefined,
) {
  if (!photoUrl) {
    throw new ApiError(422, 'Foto wajib diunggah untuk melaporkan kondisi jalur.');
  }

  const segment = await prisma.roadSegment.create({
    data: {
      // geometry column set via raw SQL right after insert (Prisma cannot
      // write Unsupported() columns directly)
      geometry: undefined as any,
      surfaceCondition: input.surfaceCondition,
      widthMeters: input.widthMeters,
      hasRamp: input.hasRamp ?? false,
      hasStairs: input.hasStairs ?? false,
      hasGuidingBlock: input.hasGuidingBlock ?? false,
      shadeLevel: input.shadeLevel,
      lightingAvailable: input.lightingAvailable ?? false,
      source: 'community',
    },
  });

  await insertRoadSegmentGeometry(segment.id, input.geometry);

  if (input.shadeLevel !== undefined) {
    await prisma.shadeObservation.create({
      data: {
        roadSegmentId: segment.id,
        observedAt: new Date(),
        shadePercent: input.shadeLevel,
        photoUrl,
      },
    });
  }

  const report = await prisma.report.create({
    data: {
      userId,
      targetType: 'ROAD_SEGMENT',
      roadSegmentId: segment.id,
      photoUrl,
      description: input.description,
    },
  });

  return { segment, report };
}

export async function listRoadSegments(lat?: number, lng?: number, radiusMeters = 1000) {
  if (lat === undefined || lng === undefined) {
    return prisma.roadSegment.findMany({ take: 100, orderBy: { updatedAt: 'desc' } });
  }
  return findRoadSegmentsNear(lat, lng, radiusMeters);
}

export async function getRoadSegmentById(id: string) {
  const segment = await prisma.roadSegment.findUnique({
    where: { id },
    include: { shadeObservations: { orderBy: { observedAt: 'desc' }, take: 10 } },
  });
  if (!segment) throw new ApiError(404, 'Segmen jalan tidak ditemukan.');
  return segment;
}
