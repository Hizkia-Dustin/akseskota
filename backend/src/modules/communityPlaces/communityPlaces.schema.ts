import { z } from 'zod';
import { isInsideBogor } from '../../utils/bogor';

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
}).refine((input) => isInsideBogor(input.longitude, input.latitude), {
  message: 'Tempat harus berada di Kota Bogor.',
  path: ['latitude'],
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

export const createDirectoryContributionSchema = z.object({
  kind: z.enum(['NEW_PLACE', 'FEATURE_STATUS']),
  externalId: z.string().trim().max(191).optional(),
  featureCode: accessibilityFeatureSchema.optional(),
  proposedAvailable: z.preprocess((value) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  }, z.boolean().optional()),
  name: z.string().trim().min(2).max(191).optional(),
  category: z.string().trim().min(2).max(100).optional(),
  address: z.string().trim().min(5).max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  note: z.string().trim().min(10).max(1500),
}).superRefine((input, context) => {
  if (input.kind === 'FEATURE_STATUS') {
    if (!input.externalId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['externalId'], message: 'Tempat wajib dipilih.' });
    if (!input.featureCode) context.addIssue({ code: z.ZodIssueCode.custom, path: ['featureCode'], message: 'Fasilitas wajib dipilih.' });
    if (typeof input.proposedAvailable !== 'boolean') context.addIssue({ code: z.ZodIssueCode.custom, path: ['proposedAvailable'], message: 'Pilih apakah fasilitas ada atau tidak ada.' });
  }
  if (input.kind === 'NEW_PLACE') {
    for (const field of ['name', 'category', 'address', 'latitude', 'longitude'] as const) {
      if (input[field] === undefined) context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} wajib diisi.` });
    }
    if (input.latitude !== undefined && input.longitude !== undefined && !isInsideBogor(input.longitude, input.latitude)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['latitude'], message: 'Tempat harus berada di Kota Bogor.' });
    }
  }
});

export const listDirectoryContributionsSchema = z.object({
  externalId: z.string().trim().max(191).optional(),
  status: z.enum(['UNVERIFIED', 'VERIFIED', 'REJECTED', 'NEEDS_RECHECK']).optional(),
});

export const voteDirectoryContributionSchema = z.object({
  decision: z.enum(['VERIFIED', 'REJECTED', 'NEEDS_RECHECK']),
  note: z.string().trim().max(500).optional(),
});

export type CreatePlacePostInput = z.infer<typeof createPlacePostSchema>;
export type SearchCommunityPlacesInput = z.infer<typeof searchCommunityPlacesSchema>;
export type CreateDirectoryContributionInput = z.infer<typeof createDirectoryContributionSchema>;
export type ListDirectoryContributionsInput = z.infer<typeof listDirectoryContributionsSchema>;
export type VoteDirectoryContributionInput = z.infer<typeof voteDirectoryContributionSchema>;
