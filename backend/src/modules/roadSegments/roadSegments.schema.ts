import { z } from 'zod';

const lineStringSchema = z.object({
  type: z.literal('LineString'),
  coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
});

// F011: gambar segmen jalan + kondisi. Foto & lokasi wajib (enforced by
// multer for photo, geometry required here).
export const addRoadSegmentSchema = z.object({
  geometry: z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), lineStringSchema),
  surfaceCondition: z.string().optional(),
  widthMeters: z.coerce.number().positive().optional(),
  hasRamp: z.coerce.boolean().optional(),
  hasStairs: z.coerce.boolean().optional(),
  hasGuidingBlock: z.coerce.boolean().optional(),
  shadeLevel: z.coerce.number().min(0).max(100).optional(),
  lightingAvailable: z.coerce.boolean().optional(),
  hasSeating: z.coerce.boolean().optional(),
  description: z.string().optional(),
});

export const listRoadSegmentsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().max(5000).optional(),
});

export type AddRoadSegmentInput = z.infer<typeof addRoadSegmentSchema>;
