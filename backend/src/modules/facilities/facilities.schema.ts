import { z } from 'zod';

const pointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const createFacilitySchema = z.object({
  type: z.enum(['RAMP', 'LIFT', 'BENCH', 'SHELTER', 'DRINKING_WATER', 'ACCESSIBLE_TOILET']),
  geometry: z.preprocess((v) => (typeof v === 'string' ? JSON.parse(v) : v), pointSchema),
  name: z.string().optional(),
  condition: z.enum(['good', 'damaged', 'unknown']).optional(),
});

export const listFacilitiesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().max(5000).optional(),
  type: z.enum(['RAMP', 'LIFT', 'BENCH', 'SHELTER', 'DRINKING_WATER', 'ACCESSIBLE_TOILET']).optional(),
});
