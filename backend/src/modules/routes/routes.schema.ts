import { z } from 'zod';

export const searchRouteSchema = z.object({
  originLat: z.coerce.number().min(-90).max(90),
  originLng: z.coerce.number().min(-180).max(180),
  destLat: z.coerce.number().min(-90).max(90),
  destLng: z.coerce.number().min(-180).max(180),
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']).optional(),
});

export type SearchRouteInput = z.infer<typeof searchRouteSchema>;

const coordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export const evaluateRoutesSchema = z.object({
  mode: z.enum(['WHEELCHAIR', 'ELDERLY', 'STROLLER', 'LOW_VISION', 'GENERAL']),
  routes: z.array(z.object({
    id: z.string().min(1).max(20),
    distanceMeters: z.number().positive(),
    geometry: z.object({
      type: z.literal('LineString'),
      coordinates: z.array(coordinateSchema).min(2).max(1500),
    }),
  })).min(1).max(3),
});

export type EvaluateRoutesInput = z.infer<typeof evaluateRoutesSchema>;
