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

  const accessibilityScore = scoreAccessibility(input);
  const comfortScore = scoreComfort(input);
  return prisma.$transaction(async (transaction) => {
    const segment = await transaction.roadSegment.create({
      data: {
      // geometry column set via raw SQL right after insert (Prisma cannot
      // write Unsupported() columns directly)
      surfaceCondition: input.surfaceCondition,
      widthMeters: input.widthMeters,
      hasRamp: input.hasRamp ?? false,
      hasStairs: input.hasStairs ?? false,
      hasGuidingBlock: input.hasGuidingBlock ?? false,
      shadeLevel: input.shadeLevel,
      lightingAvailable: input.lightingAvailable ?? false,
      accessibilityScore,
      comfortScore,
      source: 'community',
      },
    });

    await insertRoadSegmentGeometry(segment.id, input.geometry, transaction);

    if (input.shadeLevel !== undefined) {
      await transaction.shadeObservation.create({
        data: {
          roadSegmentId: segment.id,
          observedAt: new Date(),
          shadePercent: input.shadeLevel,
          photoUrl,
        },
      });
    }

    const report = await transaction.report.create({
      data: {
        userId,
        targetType: 'ROAD_SEGMENT',
        roadSegmentId: segment.id,
        photoUrl,
        description: input.description,
      },
    });

    return { segment, report };
  });
}

function scoreAccessibility(input: AddRoadSegmentInput): number {
  let score = 100;
  if (input.widthMeters === undefined) score -= 15;
  else if (input.widthMeters < 1.2) score -= 45;
  if (input.hasStairs && !input.hasRamp) score -= 60;
  if (input.surfaceCondition && ['cracked', 'unpaved', 'damaged'].includes(input.surfaceCondition.toLowerCase())) {
    score -= 25;
  }
  return Math.max(0, score);
}

function scoreComfort(input: AddRoadSegmentInput): number | undefined {
  if (input.shadeLevel === undefined && input.lightingAvailable === undefined) return undefined;
  const shade = input.shadeLevel ?? 0;
  const lighting = input.lightingAvailable ? 100 : 0;
  return Math.round(shade * 0.7 + lighting * 0.3);
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
