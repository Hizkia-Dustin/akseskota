import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

// Prisma does not natively read/write MySQL spatial (GEOMETRY) columns, so
// we drop down to raw SQL for anything spatial. Geometry is always
// exchanged as GeoJSON at the API boundary and converted with
// ST_GeomFromGeoJSON / ST_AsGeoJSON at the DB boundary. SRID 4326 (WGS84)
// throughout. MariaDB 10.4 cannot apply ST_Distance_Sphere to a LineString,
// so line/point distances use planar degrees converted approximately to
// meters. This is suitable for the short, local corridors used by the MVP.
//
// NOTE ON PLACEHOLDERS: MySQL uses positional `?` placeholders (not $1/$2
// like Postgres), and a value referenced twice in a query must be passed
// twice in the params array — Prisma's raw query layer does not support
// reusing a single bound parameter multiple times on MySQL.

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface LineString {
  type: 'LineString';
  coordinates: [number, number][];
}

type SpatialClient = Pick<Prisma.TransactionClient, '$executeRawUnsafe'>;

export async function insertRoadSegmentGeometry(id: string, geojson: LineString, client: SpatialClient = prisma) {
  await client.$executeRawUnsafe(
    `UPDATE road_segments SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify(geojson),
    id,
  );
}

export async function insertPointGeometry(table: 'facilities' | 'obstacles', id: string, geojson: Point, client: SpatialClient = prisma) {
  await client.$executeRawUnsafe(
    `UPDATE ${table} SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify(geojson),
    id,
  );
}

/**
 * Find road segments within `radiusMeters` of a point — used to build
 * candidate routes and to attach nearby facilities/obstacles to a segment.
 * MariaDB's ST_Distance returns planar coordinate units (degrees), hence the
 * local approximation of 111,320 meters per degree.
 */
export async function findRoadSegmentsNear(lat: number, lng: number, radiusMeters: number) {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT rs.id, rs.surfaceCondition as surface_condition, rs.widthMeters as width_meters, rs.hasRamp as has_ramp, rs.hasStairs as has_stairs,
            rs.hasGuidingBlock as has_guiding_block, rs.shadeLevel as shade_level, rs.lightingAvailable as lighting_available,
            rs.accessibilityScore as accessibility_score, rs.comfortScore as comfort_score,
            ST_AsGeoJSON(rs.geometry) as geojson
     FROM road_segments rs
     WHERE rs.geometry IS NOT NULL
       AND (rs.source IS NULL OR rs.source <> 'community' OR EXISTS (
         SELECT 1 FROM reports r
         WHERE r.roadSegmentId = rs.id AND r.verificationStatus = 'VERIFIED'
       ))
     LIMIT 500`,
  )) as Array<Record<string, unknown> & { geojson: string | null }>;

  return rows
    .map((row) => {
      const geometry = parseLineString(row.geojson);
      if (!geometry) return null;
      return { ...row, distance_m: distancePointToLineStringMeters([lng, lat], geometry.coordinates) };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null && row.distance_m <= radiusMeters)
    .sort((a, b) => a.distance_m - b.distance_m);
}

/** Active obstacles that intersect/near a given segment geometry. */
export async function findActiveObstaclesNearSegment(roadSegmentId: string, bufferMeters = 15) {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT o.id, o.type, o.status, o.expiresAt as expires_at, o.isActive as is_active,
            ST_AsGeoJSON(o.geometry) as geojson, ST_AsGeoJSON(rs.geometry) as segment_geojson
     FROM obstacles o JOIN road_segments rs ON rs.id = ?
     WHERE o.geometry IS NOT NULL AND rs.geometry IS NOT NULL
       AND o.isActive = true
       AND (o.expiresAt IS NULL OR o.expiresAt > NOW())`,
    roadSegmentId,
  )) as Array<Record<string, unknown> & { geojson: string; segment_geojson: string }>;

  return rows.filter((row) => {
    const point = parsePoint(row.geojson);
    const segment = parseLineString(row.segment_geojson);
    return point && segment
      ? distancePointToLineStringMeters(point.coordinates, segment.coordinates) <= bufferMeters
      : false;
  });
}

/** Facilities near a segment (bench, shelter, ramp, etc.) for comfort scoring. */
export async function findFacilitiesNearSegment(roadSegmentId: string, bufferMeters = 25) {
  const rows = (await prisma.$queryRawUnsafe(
    `SELECT f.id, f.type, f.\`condition\`, ST_AsGeoJSON(f.geometry) as geojson,
            ST_AsGeoJSON(rs.geometry) as segment_geojson
     FROM facilities f JOIN road_segments rs ON rs.id = ?
     WHERE f.geometry IS NOT NULL AND rs.geometry IS NOT NULL`,
    roadSegmentId,
  )) as Array<Record<string, unknown> & { geojson: string; segment_geojson: string }>;

  return rows.filter((row) => {
    const point = parsePoint(row.geojson);
    const segment = parseLineString(row.segment_geojson);
    return point && segment
      ? distancePointToLineStringMeters(point.coordinates, segment.coordinates) <= bufferMeters
      : false;
  });
}

export function parsePoint(value: string | null): Point | null {
  if (!value) return null;
  const parsed = JSON.parse(value) as Point;
  return parsed.type === 'Point' && parsed.coordinates.length === 2 ? parsed : null;
}

export function parseLineString(value: string | null): LineString | null {
  if (!value) return null;
  const parsed = JSON.parse(value) as LineString;
  return parsed.type === 'LineString' && parsed.coordinates.length >= 2 ? parsed : null;
}

export function distancePointToLineStringMeters(point: [number, number], line: [number, number][]): number {
  const [pointLng, pointLat] = point;
  const metersPerLngDegree = 111_320 * Math.cos((pointLat * Math.PI) / 180);
  const metersPerLatDegree = 110_540;
  let nearest = Number.POSITIVE_INFINITY;

  for (let index = 1; index < line.length; index += 1) {
    const [startLng, startLat] = line[index - 1];
    const [endLng, endLat] = line[index];
    const startX = (startLng - pointLng) * metersPerLngDegree;
    const startY = (startLat - pointLat) * metersPerLatDegree;
    const endX = (endLng - pointLng) * metersPerLngDegree;
    const endY = (endLat - pointLat) * metersPerLatDegree;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const lengthSquared = deltaX * deltaX + deltaY * deltaY;
    const ratio = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(startX * deltaX + startY * deltaY) / lengthSquared));
    nearest = Math.min(nearest, Math.hypot(startX + ratio * deltaX, startY + ratio * deltaY));
  }

  return nearest;
}

export function lineStringLengthMeters(line: [number, number][]): number {
  let total = 0;
  for (let index = 1; index < line.length; index += 1) {
    const [startLng, startLat] = line[index - 1];
    const [endLng, endLat] = line[index];
    const avgLat = (startLat + endLat) / 2;
    const deltaX = (endLng - startLng) * 111_320 * Math.cos((avgLat * Math.PI) / 180);
    const deltaY = (endLat - startLat) * 110_540;
    total += Math.hypot(deltaX, deltaY);
  }
  return total;
}

/** Samples a LineString at roughly equal distances without fabricating a new route. */
export function sampleLineStringMeters(line: [number, number][], spacingMeters = 25, maxSamples = 500): [number, number][] {
  if (line.length < 2) return [...line];
  const totalLength = lineStringLengthMeters(line);
  const sampleCount = Math.min(maxSamples, Math.max(2, Math.ceil(totalLength / spacingMeters) + 1));
  const targets = Array.from({ length: sampleCount }, (_, index) => (totalLength * index) / (sampleCount - 1));
  const result: [number, number][] = [];
  let traversed = 0;
  let targetIndex = 0;

  for (let index = 1; index < line.length && targetIndex < targets.length; index += 1) {
    const start = line[index - 1];
    const end = line[index];
    const segmentLength = lineStringLengthMeters([start, end]);
    while (targetIndex < targets.length && targets[targetIndex] <= traversed + segmentLength) {
      const ratio = segmentLength === 0 ? 0 : (targets[targetIndex] - traversed) / segmentLength;
      result.push([
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ]);
      targetIndex += 1;
    }
    traversed += segmentLength;
  }

  if (result.length < targets.length) result.push(line[line.length - 1]);
  return result;
}
