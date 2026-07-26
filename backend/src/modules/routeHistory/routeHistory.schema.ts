import { z } from 'zod';

export const saveRouteHistorySchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']).optional(),
  chosenRouteJson: z.any().optional(),
});

export type SaveRouteHistoryInput = z.infer<typeof saveRouteHistorySchema>;
