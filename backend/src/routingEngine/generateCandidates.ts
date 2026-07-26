import { prisma } from '../config/prisma';
import {
  findActiveObstaclesNearSegment,
  findFacilitiesNearSegment,
} from '../utils/spatial';
import { CandidateRoute, SegmentData } from './types';

/**
 * Generate candidate routes.
 *
 * MVP:
 * - mengambil road segment di sekitar origin & destination
 * - membuat 3 kandidat berbeda
 * - nanti AccessibilityFilter + ComfortScore yang memilih mana terbaik
 */

export async function generateCandidateRoutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<CandidateRoute[]> {

  const corridorMeters = haversineMeters(
    originLat,
    originLng,
    destLat,
    destLng,
  );

  const searchRadius = Math.max(400, corridorMeters * 0.6);

  const midLat = (originLat + destLat) / 2;
  const midLng = (originLng + destLng) / 2;

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      id,
      surface_condition,
      width_meters,
      has_ramp,
      has_stairs,
      has_guiding_block,
      shade_level,
      lighting_available,
      ST_AsGeoJSON(geometry) AS geojson,
      ST_Distance_Sphere(
        geometry,
        ST_SRID(POINT(?, ?),4326)
      ) AS distance_m
    FROM road_segments
    WHERE
      ST_Distance_Sphere(
        geometry,
        ST_SRID(POINT(?, ?),4326)
      ) <= ?
    ORDER BY distance_m ASC
    LIMIT 80
  `,
    midLng,
    midLat,
    midLng,
    midLat,
    searchRadius,
  );

  if (rows.length === 0) {
    return [];
  }

  const segments: SegmentData[] = await Promise.all(
    rows.map(async (row) => {

      const [obstacles, facilities] = await Promise.all([
        findActiveObstaclesNearSegment(row.id),
        findFacilitiesNearSegment(row.id),
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

        distanceM: Number(row.distance_m),

        geojson: JSON.parse(row.geojson),

        activeObstacles: (obstacles as any[]).map(o => ({
          id: o.id,
          type: o.type,
        })),

        nearbyFacilities: (facilities as any[]).map(f => ({
          id: f.id,
          type: f.type,
          condition: f.condition,
        })),
      };

    }),
  );

  /**
   * Kandidat 1
   * Paling pendek
   */

  const shortest = [...segments]
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 10);

  /**
   * Kandidat 2
   * Accessibility Prioritas
   */

  const accessible = [...segments]
    .sort((a, b) => {

      const scoreA =
        Number(a.hasRamp) * 3 +
        Number(!a.hasStairs) * 3 +
        Number(a.hasGuidingBlock) * 2 +
        (a.widthMeters ?? 0);

      const scoreB =
        Number(b.hasRamp) * 3 +
        Number(!b.hasStairs) * 3 +
        Number(b.hasGuidingBlock) * 2 +
        (b.widthMeters ?? 0);

      return scoreB - scoreA;
    })
    .slice(0, 10);

  /**
   * Kandidat 3
   * Comfort Prioritas
   */

  const comfortable = [...segments]
    .sort((a, b) => {

      const comfortA =
        (a.shadeLevel ?? 0) +
        (a.lightingAvailable ? 20 : 0) +
        a.nearbyFacilities.length * 10;

      const comfortB =
        (b.shadeLevel ?? 0) +
        (b.lightingAvailable ? 20 : 0) +
        b.nearbyFacilities.length * 10;

      return comfortB - comfortA;
    })
    .slice(0, 10);

  return [
    buildRoute('route-shortest', shortest, corridorMeters),
    buildRoute('route-accessible', accessible, corridorMeters),
    buildRoute('route-comfort', comfortable, corridorMeters),
  ];
}

function buildRoute(
  id: string,
  segments: SegmentData[],
  fallbackDistance: number,
): CandidateRoute {

  return {

    id,

    segments,

    distanceMeters:
      segments.reduce(
        (sum, seg) => sum + seg.distanceM,
        0,
      ) || fallbackDistance,

  };

}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {

  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a),
  );

}