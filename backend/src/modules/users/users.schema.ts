import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  shadeWeight: z.number().min(0).max(1).optional(),
  seatingWeight: z.number().min(0).max(1).optional(),
  lightingWeight: z.number().min(0).max(1).optional(),
  distanceWeight: z.number().min(0).max(1).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const createRouteHistorySchema = z.object({
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  chosenRouteJson: z.record(z.unknown()),
});

export type CreateRouteHistoryInput = z.infer<typeof createRouteHistorySchema>;
