import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { insertPointGeometry } from '../../utils/spatial';

export async function createFacility(input: {
  type: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
  name?: string;
  condition?: string;
}) {
  const facility = await prisma.facility.create({
    data: {
      type: input.type as any,
      geometry: undefined as any,
      name: input.name,
      condition: input.condition,
    },
  });
  await insertPointGeometry('facilities', facility.id, input.geometry);
  return facility;
}

export async function listFacilities(filters: { lat?: number; lng?: number; radiusMeters?: number; type?: string }) {
  if (filters.lat === undefined || filters.lng === undefined) {
    return prisma.facility.findMany({
      where: filters.type ? { type: filters.type as any } : undefined,
      take: 200,
    });
  }
  const radius = filters.radiusMeters ?? 1000;
  const params: (string | number)[] = [filters.lng, filters.lat, filters.lng, filters.lat, radius];
  let typeClause = '';
  if (filters.type) {
    typeClause = 'AND type = ?';
    params.push(filters.type);
  }
  return prisma.$queryRawUnsafe(
    `SELECT id, type, name, condition, ST_AsGeoJSON(geometry) as geojson,
            ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) as distance_m
     FROM facilities
     WHERE ST_Distance_Sphere(geometry, ST_SRID(POINT(?, ?), 4326)) <= ? ${typeClause}
     ORDER BY distance_m ASC`,
    ...params,
  );
}

export async function getFacilityById(id: string) {
  const facility = await prisma.facility.findUnique({ where: { id } });
  if (!facility) throw new ApiError(404, 'Fasilitas tidak ditemukan.');
  return facility;
}
