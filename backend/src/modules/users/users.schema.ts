import { z } from 'zod';

export const updatePreferencesSchema = z.object({
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  shadeWeight: z.number().min(0).max(1).optional(),
  seatingWeight: z.number().min(0).max(1).optional(),
  lightingWeight: z.number().min(0).max(1).optional(),
  distanceWeight: z.number().min(0).max(1).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
