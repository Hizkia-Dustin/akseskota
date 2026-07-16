import { z } from 'zod';

export const accessibilityFeatureSchema = z.enum([
  'RAMP',
  'LIFT',
  'ACCESSIBLE_TOILET',
  'ACCESSIBLE_PARKING',
  'GUIDING_BLOCK',
  'STEP_FREE',
]);

const featuresSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); }
  catch { return value.replace(/[\[\]"']/g, '').split(',').map((item) => item.trim()).filter(Boolean); }
}, z.array(accessibilityFeatureSchema).max(6).default([]));

export const createPlacePostSchema = z.object({
  externalId: z.string().min(1).max(191),
  name: z.string().trim().min(2).max(191),
  address: z.string().trim().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  title: z.string().trim().min(4).max(100),
  content: z.string().trim().min(10).max(3000),
  rating: z.coerce.number().int().min(1).max(5),
  accessibilityRating: z.coerce.number().int().min(1).max(5),
  features: featuresSchema,
});

export const searchCommunityPlacesSchema = z.object({
  query: z.string().trim().max(200).optional().default(''),
  features: z.string().optional().transform((value, context) => {
    if (!value) return [];
    const parsed = value.split(',').filter(Boolean);
    const result = z.array(accessibilityFeatureSchema).safeParse(parsed);
    if (!result.success) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Filter fasilitas tidak valid.' });
      return z.NEVER;
    }
    return result.data;
  }),
});

export type CreatePlacePostInput = z.infer<typeof createPlacePostSchema>;
export type SearchCommunityPlacesInput = z.infer<typeof searchCommunityPlacesSchema>;
