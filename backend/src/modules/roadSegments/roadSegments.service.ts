import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { findRoadSegmentsNear, insertRoadSegmentGeometry } from '../../utils/spatial';
import { AddRoadSegmentInput } from './roadSegments.schema';
import { clearRouteSearchCache } from '../routes/routeSearchCache';

export type RoadObservation = {
  surfaceCondition?: string;
  widthMeters?: number;
  hasRamp?: boolean;
  hasStairs?: boolean;
  hasGuidingBlock?: boolean;
  shadeLevel?: number;
  lightingAvailable?: boolean;
  hasSeating?: boolean;
};

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

  const point = observationPoint(input.geometry);
  const nearby = await findRoadSegmentsNear(point[1], point[0], 35, true);
  const existingSegmentId = nearby[0]
    ? String((nearby[0] as Record<string, unknown>).id)
    : undefined;
  const observation = compactObservation(input);

  return prisma.$transaction(async (transaction) => {
    const segment = existingSegmentId
      ? await transaction.roadSegment.findUniqueOrThrow({ where: { id: existingSegmentId } })
      : await transaction.roadSegment.create({
          data: { source: 'community_pending' },
        });

    if (existingSegmentId && !segment.baselineData && !['community', 'community_pending'].includes(segment.source || '')) {
      await transaction.roadSegment.update({
        where: { id: segment.id },
        data: {
          baselineData: {
            surfaceCondition: segment.surfaceCondition,
            widthMeters: segment.widthMeters,
            hasRamp: segment.hasRamp,
            hasStairs: segment.hasStairs,
            hasGuidingBlock: segment.hasGuidingBlock,
            hasSeating: segment.hasSeating,
            shadeLevel: segment.shadeLevel,
            lightingAvailable: segment.lightingAvailable,
            accessibilityScore: segment.accessibilityScore,
            comfortScore: segment.comfortScore,
            source: segment.source,
          },
        },
      });
    }

    if (!existingSegmentId) {
      await insertRoadSegmentGeometry(segment.id, asSurveyLine(input.geometry), transaction);
    }

    const report = await transaction.report.create({
      data: {
        userId,
        title: 'Observasi kondisi ruas',
        targetType: 'ROAD_SEGMENT',
        roadSegmentId: segment.id,
        photoUrl,
        description: input.description,
        observationData: observation,
      },
    });

    return {
      segment,
      report,
      matchedExistingSegment: Boolean(existingSegmentId),
      verificationRequired: 3,
      scoringImpact: 'PENDING_COMMUNITY_VERIFICATION',
    };
  });
}

export async function recomputeRoadSegmentFromVerifiedReports(roadSegmentId: string) {
  const current = await prisma.roadSegment.findUnique({ where: { id: roadSegmentId } });
  if (!current) throw new ApiError(404, 'Segmen jalan tidak ditemukan.');
  const reports = await prisma.report.findMany({
    where: {
      roadSegmentId,
      targetType: 'ROAD_SEGMENT',
      verificationStatus: 'VERIFIED',
    },
    select: { observationData: true, photoUrl: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const observations = reports
    .map((report) => report.observationData as RoadObservation | null)
    .filter((value): value is RoadObservation => Boolean(value && typeof value === 'object'));

  if (observations.length === 0) {
    const baseline = current.baselineData as (RoadObservation & {
      accessibilityScore?: number | null;
      comfortScore?: number | null;
      source?: string | null;
    }) | null;
    const reset = await prisma.roadSegment.update({
      where: { id: roadSegmentId },
      data: {
        surfaceCondition: baseline?.surfaceCondition ?? null,
        widthMeters: baseline?.widthMeters ?? null,
        hasRamp: baseline?.hasRamp ?? false,
        hasStairs: baseline?.hasStairs ?? false,
        hasGuidingBlock: baseline?.hasGuidingBlock ?? false,
        hasSeating: baseline?.hasSeating ?? false,
        shadeLevel: baseline?.shadeLevel ?? null,
        lightingAvailable: baseline?.lightingAvailable ?? false,
        accessibilityScore: baseline?.accessibilityScore ?? null,
        comfortScore: baseline?.comfortScore ?? null,
        communityObservationCount: 0,
        dataConfidence: null,
        lastCommunityUpdateAt: null,
        source: baseline?.source ?? 'community_pending',
      },
    });
    clearRouteSearchCache();
    return { segment: reset, aggregate: null, observationCount: 0, dataConfidence: 0 };
  }

  const aggregate = aggregateRoadObservations(observations);
  const count = observations.length;
  const dataConfidence = Math.min(100, 45 + count * 15);
  const updated = await prisma.roadSegment.update({
    where: { id: roadSegmentId },
    data: {
      ...aggregate,
      accessibilityScore: scoreAccessibility(aggregate),
      comfortScore: scoreComfort(aggregate),
      communityObservationCount: count,
      dataConfidence,
      lastCommunityUpdateAt: new Date(),
      source: current.source === 'community_pending' ? 'community' : current.source || 'community',
    },
  });

  const latestShadeReport = [...reports].reverse().find((report) => {
    const value = report.observationData as RoadObservation | null;
    return typeof value?.shadeLevel === 'number';
  });
  if (latestShadeReport) {
    const value = latestShadeReport.observationData as RoadObservation;
    const latestStored = await prisma.shadeObservation.findFirst({
      where: { roadSegmentId },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestStored || latestStored.photoUrl !== latestShadeReport.photoUrl) {
      await prisma.shadeObservation.create({
        data: {
          roadSegmentId,
          observedAt: latestShadeReport.createdAt,
          shadePercent: value.shadeLevel!,
          photoUrl: latestShadeReport.photoUrl,
        },
      });
    }
  }
  clearRouteSearchCache();
  return { segment: updated, aggregate, observationCount: count, dataConfidence };
}

export function aggregateRoadObservations(observations: RoadObservation[]): RoadObservation {
  return {
    surfaceCondition: mode(observations.map((item) => item.surfaceCondition)),
    widthMeters: median(observations.map((item) => item.widthMeters)),
    hasRamp: majority(observations.map((item) => item.hasRamp), false),
    hasStairs: majority(observations.map((item) => item.hasStairs), true),
    hasGuidingBlock: majority(observations.map((item) => item.hasGuidingBlock), false),
    shadeLevel: median(observations.map((item) => item.shadeLevel)),
    lightingAvailable: majority(observations.map((item) => item.lightingAvailable), false),
    hasSeating: majority(observations.map((item) => item.hasSeating), false),
  };
}

function scoreAccessibility(input: RoadObservation): number {
  let score = 100;
  if (input.widthMeters === undefined) score -= 15;
  else if (input.widthMeters < 1.2) score -= 45;
  if (input.hasStairs && !input.hasRamp) score -= 60;
  if (input.hasRamp === false) score -= 10;
  if (input.hasGuidingBlock === false) score -= 8;
  if (input.surfaceCondition && ['cracked', 'unpaved', 'damaged'].includes(input.surfaceCondition.toLowerCase())) {
    score -= 25;
  }
  return Math.max(0, score);
}

function scoreComfort(input: RoadObservation): number | undefined {
  if (input.shadeLevel === undefined && input.lightingAvailable === undefined && input.hasSeating === undefined) return undefined;
  const shade = input.shadeLevel ?? 0;
  const lighting = input.lightingAvailable ? 100 : 0;
  const seating = input.hasSeating ? 100 : 0;
  return Math.round(shade * 0.55 + lighting * 0.25 + seating * 0.2);
}

function compactObservation(input: AddRoadSegmentInput): RoadObservation {
  return Object.fromEntries(Object.entries({
    surfaceCondition: input.surfaceCondition,
    widthMeters: input.widthMeters,
    hasRamp: input.hasRamp,
    hasStairs: input.hasStairs,
    hasGuidingBlock: input.hasGuidingBlock,
    shadeLevel: input.shadeLevel,
    lightingAvailable: input.lightingAvailable,
    hasSeating: input.hasSeating,
  }).filter(([, value]) => value !== undefined)) as RoadObservation;
}

function observationPoint(geometry: AddRoadSegmentInput['geometry']): [number, number] {
  if (geometry.type === 'Point') return geometry.coordinates;
  return geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
}

function asSurveyLine(geometry: AddRoadSegmentInput['geometry']) {
  if (geometry.type === 'LineString') return geometry;
  const [lng, lat] = geometry.coordinates;
  const lngDelta = 15 / (111_320 * Math.cos((lat * Math.PI) / 180));
  return {
    type: 'LineString' as const,
    coordinates: [[lng - lngDelta, lat], [lng + lngDelta, lat]] as [number, number][],
  };
}

function median(values: Array<number | undefined>) {
  const known = values.filter((value): value is number => typeof value === 'number').sort((a, b) => a - b);
  if (!known.length) return undefined;
  const middle = Math.floor(known.length / 2);
  return known.length % 2 ? known[middle] : Math.round(((known[middle - 1] + known[middle]) / 2) * 10) / 10;
}

function majority(values: Array<boolean | undefined>, tieResult: boolean) {
  const known = values.filter((value): value is boolean => typeof value === 'boolean');
  if (!known.length) return undefined;
  const yes = known.filter(Boolean).length;
  const no = known.length - yes;
  if (yes === no) return tieResult;
  return yes > no;
}

function mode(values: Array<string | undefined>) {
  const known = values.filter((value): value is string => Boolean(value));
  if (!known.length) return undefined;
  const counts = known.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts).sort((first, second) => second[1] - first[1])[0][0];
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
