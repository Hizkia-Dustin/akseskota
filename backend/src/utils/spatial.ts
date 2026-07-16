import { prisma } from '../config/prisma';

// Prisma does not natively read/write MySQL spatial (GEOMETRY) columns, so
// we drop down to raw SQL for anything spatial. Geometry is always
// exchanged as GeoJSON at the API boundary and converted with
// ST_GeomFromGeoJSON / ST_AsGeoJSON at the DB boundary. SRID 4326 (WGS84)
// throughout. Requires MySQL 8.0.24+ (ST_Distance_Sphere support extended
// to LineString/Polygon, not just Point-to-Point).
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
    `UPDATE road_segments SET geometry = ST_SRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ?`,
    JSON.stringify(geojson),
    id,
  );
}

export async function insertPointGeometry(table: 'facilities' | 'obstacles', id: string, geojson: Point) {
  await prisma.$executeRawUnsafe(
    `UPDATE ${table} SET geometry = ST_SRID(ST_GeomFromGeoJSON(?), 4326) WHERE id = ?`,
    JSON.stringify(geojson),
    id,
  );
}

/**
 * Find road segments within `radiusMeters` of a point — used to build
 * candidate routes and to attach nearby facilities/obstacles to a segment.
 * ST_Distance_Sphere returns meters directly for SRID 4326 geometry, no
 * ::geography cast needed like PostGIS.
 */
export async function findRoadSegmentsNear(lat: number, lng: number, radiusMeters: number) {
  return prisma.$queryRawUnsafe(
    `SELECT id, surface_condition, width_meters, has_ramp, has_stairs,
            has_guiding_block, shade_level, lighting_available,
            accessibility_score, comfort_score,
            ST_AsGeoJSON(geometry) as geojson,
            ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) as distance_m
     FROM road_segments
     WHERE ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) <= ?
     ORDER BY distance_m ASC`,
    lng,
    lat,
    lng,
    lat,
    radiusMeters,
  );
}

/** Active obstacles that intersect/near a given segment geometry. */
export async function findActiveObstaclesNearSegment(roadSegmentId: string, bufferMeters = 15) {
  return prisma.$queryRawUnsafe(
    `SELECT o.id, o.type, o.status, o.expires_at, o.is_active,
            ST_AsGeoJSON(o.geometry) as geojson
     FROM obstacles o, road_segments rs
     WHERE rs.id = ?
       AND o.is_active = true
       AND (o.expires_at IS NULL OR o.expires_at > NOW())
       AND ST_Distance_Sphere(o.geometry, rs.geometry) <= ?`,
    roadSegmentId,
    bufferMeters,
  );
}

/** Facilities near a segment (bench, shelter, ramp, etc.) for comfort scoring. */
export async function findFacilitiesNearSegment(roadSegmentId: string, bufferMeters = 25) {
  return prisma.$queryRawUnsafe(
    `SELECT f.id, f.type, f.condition, ST_AsGeoJSON(f.geometry) as geojson
     FROM facilities f, road_segments rs
     WHERE rs.id = ?
       AND ST_Distance_Sphere(f.geometry, rs.geometry) <= ?`,
    roadSegmentId,
    bufferMeters,
  );
}
