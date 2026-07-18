import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { recommendRoutes } from '../../routingEngine';
import { PersonalMode, PreferenceWeights } from '../../routingEngine/types';
import { EvaluateRoutesInput, SearchRouteInput } from './routes.schema';
import { getSearchResult, saveSearchResult } from './routeSearchCache';
import { distancePointToLineStringMeters, parseLineString, parsePoint, sampleLineStringMeters } from '../../utils/spatial';
import { yenKShortestPaths } from '../../routingEngine/weightedDijkstra';

const DEFAULT_WEIGHTS: PreferenceWeights = {
  shadeWeight: 0.3,
  seatingWeight: 0.2,
  lightingWeight: 0.2,
  distanceWeight: 0.3,
};

// F004: search route. Uses logged-in user's saved preference (F002) when
// available, otherwise falls back to query param mode + default weights.
export async function searchRoutes(input: SearchRouteInput, userId?: string) {
  let mode: PersonalMode = input.mode ?? 'GENERAL';
  let weights: PreferenceWeights = DEFAULT_WEIGHTS;

  if (userId) {
    const prefs = await prisma.userPreference.findUnique({ where: { userId } });
    if (prefs) {
      mode = input.mode ?? (prefs.mode as PersonalMode);
      weights = {
        shadeWeight: prefs.shadeWeight,
        seatingWeight: prefs.seatingWeight,
        lightingWeight: prefs.lightingWeight,
        distanceWeight: prefs.distanceWeight,
      };
    }
  }

  const { routes, eliminated } = await recommendRoutes({
    originLat: input.originLat,
    originLng: input.originLng,
    destLat: input.destLat,
    destLng: input.destLng,
    mode,
    weights,
  });

  // F004 acceptance: tidak boleh kosong -> if zero routes survive, this is
  // a legitimate empty state the controller should render distinctly from
  // an error (e.g. every candidate hit a hard constraint).
  const searchId = randomUUID();
  saveSearchResult(searchId, routes, eliminated);

  return { searchId, mode, routes, eliminated };
}

// F006: route detail — full step data for one specific route from a
// previous search.
export async function getRouteDetail(searchId: string, routeId: string) {
  const cached = getSearchResult(searchId);
  if (!cached) {
    throw new ApiError(404, 'Hasil pencarian rute sudah kedaluwarsa. Silakan cari ulang.');
  }
  const route = cached.routes.find((r) => r.id === routeId);
  if (!route) {
    throw new ApiError(404, 'Rute tidak ditemukan pada hasil pencarian ini.');
  }
  return route;
}

export async function evaluateMapboxRoutes(input: EvaluateRoutesInput) {
  const roadRows = (await prisma.$queryRawUnsafe(
    `SELECT rs.id, rs.accessibilityScore AS accessibility_score, rs.comfortScore AS comfort_score,
            rs.shadeLevel AS shade_level, ST_AsGeoJSON(rs.geometry) AS geometry
     FROM road_segments rs
     WHERE rs.geometry IS NOT NULL
       AND (rs.source IS NULL OR rs.source <> 'community' OR EXISTS (
         SELECT 1 FROM reports r
         WHERE r.roadSegmentId = rs.id AND r.verificationStatus = 'VERIFIED'
       ))
     LIMIT 1000`,
  )) as Array<{ id: string; accessibility_score: number | null; comfort_score: number | null; shade_level: number | null; geometry: string }>;

  const obstacleRows = (await prisma.$queryRawUnsafe(
    `SELECT o.id, o.type, ST_AsGeoJSON(o.geometry) AS geometry
     FROM obstacles o
     WHERE o.isActive = true AND o.geometry IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM reports r
         WHERE r.obstacleId = o.id AND r.verificationStatus = 'VERIFIED'
       )
       AND (o.expiresAt IS NULL OR o.expiresAt > NOW())`,
  )) as Array<{ id: string; type: string; geometry: string }>;

  const roads = roadRows.map((row) => ({ ...row, parsed: parseLineString(row.geometry) })).filter((row) => row.parsed);
  const obstacles = obstacleRows.map((row) => ({ ...row, parsed: parsePoint(row.geometry) })).filter((row) => row.parsed);

  const evaluated = input.routes.map((route) => {
    const routeLine = route.geometry.coordinates as [number, number][];
    const routeBounds = lineBounds(routeLine, 35);
    const candidateRoads = roads.filter((road) => boundsOverlap(routeBounds, lineBounds(road.parsed!.coordinates)));
    const samples = sampleLineStringMeters(routeLine);
    const sampledRoadValues: Array<{ accessibility: number | null; comfort: number | null; shade: number | null }> = [];

    for (const sample of samples) {
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestRoad: typeof candidateRoads[number] | undefined;
      for (const road of candidateRoads) {
        const distance = distancePointToLineStringMeters(sample, road.parsed!.coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestRoad = road;
        }
      }
      if (nearestRoad && nearestDistance <= 25) {
        sampledRoadValues.push({
          accessibility: nearestRoad.accessibility_score,
          comfort: nearestRoad.comfort_score,
          shade: nearestRoad.shade_level,
        });
      }
    }

    const coverage = samples.length ? Math.round((sampledRoadValues.length / samples.length) * 100) : 0;
    const routeObstacles = obstacles.filter((obstacle) => distancePointToLineStringMeters(obstacle.parsed!.coordinates, routeLine) <= 18);
    const values = (key: 'accessibility' | 'comfort' | 'shade') => sampledRoadValues.map((sample) => sample[key]).filter((value): value is number => value !== null);
    const average = (numbers: number[]) => numbers.length ? Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : null;
    const rawAccessibility = average(values('accessibility'));
    const comfort = average(values('comfort'));
    const shade = average(values('shade'));
    const blockingTypes = input.mode === 'WHEELCHAIR' || input.mode === 'STROLLER'
      ? ['STAIRS', 'CONSTRUCTION', 'FALLEN_TREE']
      : ['CONSTRUCTION', 'FALLEN_TREE'];
    const blocking = routeObstacles.filter((obstacle) => blockingTypes.includes(obstacle.type));
    const enoughData = coverage >= 40;
    const accessibility = blocking.length > 0 ? 0 : enoughData && rawAccessibility !== null
      ? Math.max(0, rawAccessibility - routeObstacles.length * 8)
      : null;

    const criteriaPenalties = buildCriteriaPenalties({
      accessibility,
      comfort: enoughData ? comfort : null,
      shade: enoughData ? shade : null,
      coverage,
      obstacleCount: routeObstacles.length,
      blocked: blocking.length > 0,
    });
    const algorithmCost = blocking.length > 0
      ? null
      : Math.round(route.distanceMeters * accessibilityCostMultiplier(input.mode, criteriaPenalties));

    return {
      id: route.id,
      accessibility,
      comfort: enoughData ? comfort : null,
      shade: enoughData ? shade : null,
      dataCoverage: coverage,
      dataStatus: enoughData ? 'CUKUP' : sampledRoadValues.length ? 'TERBATAS' : 'BELUM_ADA',
      verifiedObstacleCount: routeObstacles.length,
      blocked: blocking.length > 0,
      algorithmCost,
      algorithmRank: null as number | null,
      criteriaPenalties,
      reasons: [
        ...(blocking.length ? [`Ditolak: ${blocking.length} hambatan terverifikasi menghalangi profil ini`] : []),
        ...(routeObstacles.length && !blocking.length ? [`${routeObstacles.length} hambatan terverifikasi di sekitar rute`] : []),
        ...(!enoughData ? [`Cakupan data komunitas baru ${coverage}%`] : []),
      ],
      labels: [] as string[],
    };
  });

  const candidateEdges = evaluated
    .filter((route) => route.algorithmCost !== null)
    .map((route) => ({ id: route.id, from: 'origin', to: 'destination', cost: route.algorithmCost!, data: route.id }));
  const rankedPaths = yenKShortestPaths(candidateEdges, 'origin', 'destination', candidateEdges.length);
  rankedPaths.forEach((path, index) => {
    const route = evaluated.find((item) => item.id === path.edges[0]?.data);
    if (route) route.algorithmRank = index + 1;
  });

  const eligibleAccess = evaluated.filter((route) => route.accessibility !== null && !route.blocked);
  const eligibleShade = evaluated.filter((route) => route.shade !== null && !route.blocked);
  const eligibleComfort = evaluated.filter((route) => route.comfort !== null && !route.blocked);
  if (eligibleAccess.length) eligibleAccess.sort((a, b) => b.accessibility! - a.accessibility!)[0].labels.push('Paling Aksesibel');
  if (eligibleShade.length) eligibleShade.sort((a, b) => b.shade! - a.shade!)[0].labels.push('Paling Teduh');
  if (eligibleComfort.length) eligibleComfort.sort((a, b) => b.comfort! - a.comfort!)[0].labels.push('Paling Nyaman');

  return evaluated;
}

type Bounds = [number, number, number, number];

function lineBounds(line: [number, number][], paddingMeters = 0): Bounds {
  const lngs = line.map(([lng]) => lng);
  const lats = line.map(([, lat]) => lat);
  const averageLat = lats.reduce((sum, lat) => sum + lat, 0) / Math.max(1, lats.length);
  const latPadding = paddingMeters / 110_540;
  const lngPadding = paddingMeters / (111_320 * Math.max(0.2, Math.cos((averageLat * Math.PI) / 180)));
  return [
    Math.min(...lngs) - lngPadding,
    Math.min(...lats) - latPadding,
    Math.max(...lngs) + lngPadding,
    Math.max(...lats) + latPadding,
  ];
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

interface CriteriaPenalties {
  safety: number;
  ease: number;
  usability: number;
  independence: number;
}

function buildCriteriaPenalties(input: {
  accessibility: number | null;
  comfort: number | null;
  shade: number | null;
  coverage: number;
  obstacleCount: number;
  blocked: boolean;
}): CriteriaPenalties {
  const accessibilityPenalty = input.accessibility === null ? 0.25 : (100 - input.accessibility) / 100;
  const comfortPenalty = input.comfort === null ? 0.2 : (100 - input.comfort) / 100;
  const shadePenalty = input.shade === null ? 0.15 : (100 - input.shade) / 100;
  const uncertainty = (100 - input.coverage) / 100;

  return {
    safety: input.blocked ? 1 : Math.min(1, input.obstacleCount * 0.2),
    ease: clampPenalty(accessibilityPenalty),
    usability: clampPenalty(comfortPenalty * 0.65 + shadePenalty * 0.35),
    independence: clampPenalty(accessibilityPenalty * 0.65 + uncertainty * 0.35),
  };
}

function accessibilityCostMultiplier(mode: PersonalMode, penalties: CriteriaPenalties): number {
  const weights: Record<PersonalMode, CriteriaPenalties> = {
    WHEELCHAIR: { safety: 0.4, ease: 0.35, usability: 0.1, independence: 0.15 },
    STROLLER: { safety: 0.4, ease: 0.35, usability: 0.15, independence: 0.1 },
    LOW_VISION: { safety: 0.35, ease: 0.2, usability: 0.15, independence: 0.3 },
    ELDERLY: { safety: 0.35, ease: 0.25, usability: 0.25, independence: 0.15 },
    GENERAL: { safety: 0.3, ease: 0.25, usability: 0.3, independence: 0.15 },
  };
  const profile = weights[mode];
  return 1
    + penalties.safety * profile.safety
    + penalties.ease * profile.ease
    + penalties.usability * profile.usability
    + penalties.independence * profile.independence;
}

function clampPenalty(value: number): number {
  return Math.max(0, Math.min(1, value));
}
