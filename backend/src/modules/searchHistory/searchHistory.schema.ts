import { z } from 'zod';

export const searchHistorySchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']).optional(),
});

export type SearchHistoryInput = z.infer<typeof searchHistorySchema>;
