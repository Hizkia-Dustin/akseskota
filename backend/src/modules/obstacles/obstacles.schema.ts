import { z } from 'zod';
import { isInsideBogor } from '../../utils/bogor';

const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
}).refine(({ coordinates }) => isInsideBogor(coordinates[0], coordinates[1]), {
  message: 'Titik laporan harus berada di Kota Bogor.',
  path: ['coordinates'],
});

function parseJsonField(value: unknown) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// F012: jenis hambatan, status sementara/permanen, dapat diberi masa berlaku
export const reportObstacleSchema = z.object({
  title: z.string().trim().min(4, 'Judul minimal 4 karakter').max(100, 'Judul maksimal 100 karakter'),
  type: z.enum(['STAIRS', 'POTHOLE', 'FLOOD', 'PARKED_VEHICLE', 'CONSTRUCTION', 'FALLEN_TREE']),
  geometry: z.preprocess(parseJsonField, pointSchema),
  status: z.enum(['TEMPORARY', 'PERMANENT']).default('TEMPORARY'),
  description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter').max(1000).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const listObstaclesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().max(5000).optional(),
  activeOnly: z.coerce.boolean().optional(),
});

export type ReportObstacleInput = z.infer<typeof reportObstacleSchema>;
