import { z } from 'zod';

export const startNavigationSchema = z.object({
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']).optional(),
});

export const finishNavigationSchema = z.object({
  sessionId: z.string().uuid(),
  distanceMeters: z.number().min(0).optional(),
  durationSeconds: z.number().min(0).optional(),
});

export type StartNavigationInput = z.infer<typeof startNavigationSchema>;
export type FinishNavigationInput = z.infer<typeof finishNavigationSchema>;
