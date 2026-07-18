import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  shadeWeight: z.number().min(0).max(1).optional(),
  seatingWeight: z.number().min(0).max(1).optional(),
  lightingWeight: z.number().min(0).max(1).optional(),
  distanceWeight: z.number().min(0).max(1).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

const routeCoordinateSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const chosenRouteSchema = z.object({
  id: z.string().min(1).max(20),
  originName: z.string().trim().max(191),
  destinationName: z.string().trim().max(191),
  distance: z.string().max(30),
  time: z.string().max(30),
  score: z.number().min(0).max(100).nullable().optional(),
  shade: z.number().min(0).max(100).nullable().optional(),
  dataCoverage: z.number().min(0).max(100).optional(),
  badge: z.string().max(100).optional(),
  algorithmRank: z.number().int().min(1).max(3).nullable().optional(),
  algorithmCost: z.number().nonnegative().nullable().optional(),
  criteriaPenalties: z.record(z.number().min(0).max(1)).optional(),
  distanceMeters: z.number().positive(),
  durationSeconds: z.number().positive(),
  geometry: z.object({
    type: z.literal('LineString'),
    coordinates: z.array(routeCoordinateSchema).min(2).max(1500),
  }),
  steps: z.array(z.object({
    instruction: z.string().trim().min(1).max(500),
    distance: z.string().max(30),
    distanceMeters: z.number().nonnegative().optional(),
    location: routeCoordinateSchema.nullable().optional(),
  })).max(500),
});

export const createRouteHistorySchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  chosenRouteJson: chosenRouteSchema,
});

export type CreateRouteHistoryInput = z.infer<typeof createRouteHistorySchema>;
