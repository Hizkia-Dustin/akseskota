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

export async function insertRoadSegmentGeometry(id: string, geojson: LineString) {
  await prisma.$executeRawUnsafe(
    `UPDATE road_segments SET geometry = ST_GeomFromGeoJSON(?, 1, 4326) WHERE id = ?`,
    JSON.stringify(geojson),
    id,
  );
}

export async function insertPointGeometry(table: 'facilities' | 'obstacles', id: string, geojson: Point) {
  await prisma.$executeRawUnsafe(
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
    `SELECT id, surfaceCondition as surface_condition, widthMeters as width_meters, hasRamp as has_ramp, hasStairs as has_stairs,
            hasGuidingBlock as has_guiding_block, shadeLevel as shade_level, lightingAvailable as lighting_available,
            accessibilityScore as accessibility_score, comfortScore as comfort_score,
            ST_AsGeoJSON(geometry) as geojson
     FROM road_segments
     WHERE geometry IS NOT NULL
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
