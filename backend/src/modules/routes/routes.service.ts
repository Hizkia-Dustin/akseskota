import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { recommendRoutes } from '../../routingEngine';
import { PersonalMode, PreferenceWeights } from '../../routingEngine/types';
import { EvaluateRoutesInput, SearchRouteInput } from './routes.schema';
import { getSearchResult, saveSearchResult } from './routeSearchCache';
import { distancePointToLineStringMeters, lineStringLengthMeters, parseLineString, parsePoint } from '../../utils/spatial';

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

  if (userId && routes.length > 0) {
    await prisma.routeHistory.create({
      data: {
        userId,
        originLat: input.originLat,
        originLng: input.originLng,
        destLat: input.destLat,
        destLng: input.destLng,
        mode,
      },
    });
  }

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
    `SELECT id, accessibilityScore AS accessibility_score, comfortScore AS comfort_score,
            shadeLevel AS shade_level, ST_AsGeoJSON(geometry) AS geometry
     FROM road_segments
     WHERE geometry IS NOT NULL
     LIMIT 1000`,
  )) as Array<{ id: string; accessibility_score: number | null; comfort_score: number | null; shade_level: number | null; geometry: string }>;

  const obstacleRows = (await prisma.$queryRawUnsafe(
    `SELECT o.id, o.type, ST_AsGeoJSON(o.geometry) AS geometry
     FROM obstacles o
     JOIN reports r ON r.obstacleId = o.id
     WHERE r.verificationStatus = 'VERIFIED' AND o.isActive = true AND o.geometry IS NOT NULL
       AND (o.expiresAt IS NULL OR o.expiresAt > NOW())`,
  )) as Array<{ id: string; type: string; geometry: string }>;

  const roads = roadRows.map((row) => ({ ...row, parsed: parseLineString(row.geometry) })).filter((row) => row.parsed);
  const obstacles = obstacleRows.map((row) => ({ ...row, parsed: parsePoint(row.geometry) })).filter((row) => row.parsed);

  const evaluated = input.routes.map((route) => {
    const routeLine = route.geometry.coordinates as [number, number][];
    const matched = roads.filter((road) => {
      const coordinates = road.parsed!.coordinates;
      const midpoint = coordinates[Math.floor(coordinates.length / 2)];
      return distancePointToLineStringMeters(midpoint, routeLine) <= 25;
    });
    const matchedLength = matched.reduce((sum, road) => sum + lineStringLengthMeters(road.parsed!.coordinates), 0);
    const coverage = Math.min(100, Math.round((matchedLength / route.distanceMeters) * 100));
    const routeObstacles = obstacles.filter((obstacle) => distancePointToLineStringMeters(obstacle.parsed!.coordinates, routeLine) <= 18);
    const values = (key: 'accessibility_score' | 'comfort_score' | 'shade_level') => matched.map((road) => road[key]).filter((value): value is number => value !== null);
    const average = (numbers: number[]) => numbers.length ? Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length) : null;
    const rawAccessibility = average(values('accessibility_score'));
    const comfort = average(values('comfort_score'));
    const shade = average(values('shade_level'));
    const blockingTypes = input.mode === 'WHEELCHAIR' || input.mode === 'STROLLER'
      ? ['STAIRS', 'CONSTRUCTION', 'FALLEN_TREE']
      : ['CONSTRUCTION', 'FALLEN_TREE'];
    const blocking = routeObstacles.filter((obstacle) => blockingTypes.includes(obstacle.type));
    const enoughData = coverage >= 40;
    const accessibility = blocking.length > 0 ? 0 : enoughData && rawAccessibility !== null
      ? Math.max(0, rawAccessibility - routeObstacles.length * 8)
      : null;

    return {
      id: route.id,
      accessibility,
      comfort: enoughData ? comfort : null,
      shade: enoughData ? shade : null,
      dataCoverage: coverage,
      dataStatus: enoughData ? 'CUKUP' : matched.length ? 'TERBATAS' : 'BELUM_ADA',
      verifiedObstacleCount: routeObstacles.length,
      blocked: blocking.length > 0,
      reasons: [
        ...(blocking.length ? [`Ditolak: ${blocking.length} hambatan terverifikasi menghalangi profil ini`] : []),
        ...(routeObstacles.length && !blocking.length ? [`${routeObstacles.length} hambatan terverifikasi di sekitar rute`] : []),
        ...(!enoughData ? [`Cakupan data komunitas baru ${coverage}%`] : []),
      ],
      labels: [] as string[],
    };
  });

  const eligibleAccess = evaluated.filter((route) => route.accessibility !== null && !route.blocked);
  const eligibleShade = evaluated.filter((route) => route.shade !== null && !route.blocked);
  const eligibleComfort = evaluated.filter((route) => route.comfort !== null && !route.blocked);
  if (eligibleAccess.length) eligibleAccess.sort((a, b) => b.accessibility! - a.accessibility!)[0].labels.push('Paling Aksesibel');
  if (eligibleShade.length) eligibleShade.sort((a, b) => b.shade! - a.shade!)[0].labels.push('Paling Teduh');
  if (eligibleComfort.length) eligibleComfort.sort((a, b) => b.comfort! - a.comfort!)[0].labels.push('Paling Nyaman');

  return evaluated;
}
