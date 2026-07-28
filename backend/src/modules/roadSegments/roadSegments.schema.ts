import { z } from 'zod';
import { isInsideBogor } from '../../utils/bogor';

const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
}).refine(({ coordinates }) => coordinates.every(([lng, lat]) => isInsideBogor(lng, lat)), {
  message: 'Seluruh ruas survei harus berada di Kota Bogor.',
  path: ['coordinates'],
});

const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
}).refine(({ coordinates: [lng, lat] }) => isInsideBogor(lng, lat), {
  message: 'Titik observasi harus berada di Kota Bogor.',
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

function parseOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}

// F011: gambar segmen jalan + kondisi. Foto & lokasi wajib (enforced by
// multer for photo, geometry required here).
export const addRoadSegmentSchema = z.object({
  geometry: z.preprocess(parseJsonField, z.union([lineStringSchema, pointSchema])),
  surfaceCondition: z.string().optional(),
  widthMeters: z.coerce.number().positive().optional(),
  hasRamp: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  hasStairs: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  hasGuidingBlock: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  shadeLevel: z.coerce.number().min(0).max(100).optional(),
  lightingAvailable: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  hasSeating: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
  description: z.string().trim().max(1000).optional(),
}).refine((input) => [
  input.surfaceCondition,
  input.widthMeters,
  input.hasRamp,
  input.hasStairs,
  input.hasGuidingBlock,
  input.shadeLevel,
  input.lightingAvailable,
  input.hasSeating,
].some((value) => value !== undefined), {
  message: 'Isi minimal satu kondisi ruas yang diamati.',
});

export const listRoadSegmentsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().max(5000).optional(),
});

export type AddRoadSegmentInput = z.infer<typeof addRoadSegmentSchema>;
