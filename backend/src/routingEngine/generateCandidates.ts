import { prisma } from '../config/prisma';
import { findActiveObstaclesNearSegment, findFacilitiesNearSegment } from '../utils/spatial';
import { CandidateRoute, SegmentData } from './types';

/**
 * Generates candidate routes between origin and destination.
 *
 * IMPORTANT — scaffold limitation: this uses a straight-line corridor buffer
 * over `road_segments` as a pragmatic MVP substitute for real pedestrian
 * pathfinding. It satisfies F004 (>= 3 alternatives) and lets the
 * accessibility/comfort/live-condition layers be exercised end-to-end.
 * For production-quality routing, replace this with a dedicated pedestrian
 * routing engine — e.g. self-hosted OSRM/GraphHopper with a walking
 * profile, or Valhalla — over a proper street network graph (pgRouting is
 * Postgres-only, not applicable now that the DB is MySQL). Keep the same
 * `CandidateRoute` output shape so nothing downstream needs to change.
 */
export async function generateCandidateRoutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<CandidateRoute[]> {
  const corridorMeters = haversineMeters(originLat, originLng, destLat, destLng);
  const searchRadius = Math.max(300, corridorMeters * 0.6);

  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  const rows = (await prisma.$queryRawUnsafe(
    `SELECT id, surface_condition, width_meters, has_ramp, has_stairs,
            has_guiding_block, shade_level, lighting_available,
            ST_AsGeoJSON(geometry) as geojson,
            ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) as distance_m
     FROM road_segments
     WHERE ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) <= ?
     ORDER BY distance_m ASC
     LIMIT 60`,
    midLng,
    midLat,
    midLng,
    midLat,
    searchRadius,
  )) as any[];

  if (rows.length === 0) return [];

  const enriched: SegmentData[] = await Promise.all(
    rows.map(async (row) => {
      const [obstacles, facilities] = await Promise.all([
        findActiveObstaclesNearSegment(row.id) as Promise<any[]>,
        findFacilitiesNearSegment(row.id) as Promise<any[]>,
      ]);
      return {
        id: row.id,
        surfaceCondition: row.surface_condition,
        widthMeters: row.width_meters,
        hasRamp: row.has_ramp,
        hasStairs: row.has_stairs,
        hasGuidingBlock: row.has_guiding_block,
        shadeLevel: row.shade_level,
        lightingAvailable: row.lighting_available,
        distanceM: row.distance_m,
        geojson: JSON.parse(row.geojson),
        activeObstacles: obstacles.map((o) => ({ id: o.id, type: o.type })),
        nearbyFacilities: facilities.map((f) => ({ id: f.id, type: f.type, condition: f.condition })),
      };
    }),
  );

  // Build 3 candidate "profiles" from the same segment pool: shortest,
  // most-accessible-first, most-comfortable-first. This gives F005/F006
  // meaningfully different routes to compare while the pool is shared.
  const shortest = [...enriched].sort((a, b) => a.distanceM - b.distanceM).slice(0, 8);
  const accessibleFirst = [...enriched]
    .sort((a, b) => Number(b.hasRamp) - Number(a.hasRamp) || a.distanceM - b.distanceM)
    .slice(0, 8);
  const comfortFirst = [...enriched]
    .sort((a, b) => (b.shadeLevel ?? 0) - (a.shadeLevel ?? 0) || a.distanceM - b.distanceM)
    .slice(0, 8);

  const toRoute = (id: string, segments: SegmentData[]): CandidateRoute => ({
    id,
    segments,
    distanceMeters: segments.reduce((sum, s) => sum + s.distanceM, 0) || corridorMeters,
  });

  return [
    toRoute('route-a', shortest),
    toRoute('route-b', accessibleFirst),
    toRoute('route-c', comfortFirst),
  ];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
