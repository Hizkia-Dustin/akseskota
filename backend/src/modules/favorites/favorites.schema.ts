import { z } from 'zod';

export const favoriteRouteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  originLat: z.number(),
  originLng: z.number(),
  destLat: z.number(),
  destLng: z.number(),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']).optional(),
  routeJson: z.any().optional(),
});

export type FavoriteRouteInput = z.infer<typeof favoriteRouteSchema>;
