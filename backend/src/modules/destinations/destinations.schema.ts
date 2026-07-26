import { z } from 'zod';

export const destinationFeatureSchema = z.enum([
  'WHEELCHAIR_ENTRANCE',
  'WHEELCHAIR_SEATING',
  'WHEELCHAIR_RESTROOM',
  'WHEELCHAIR_PARKING',
]);

export const searchDestinationsSchema = z.object({
  query: z.string().trim().max(120).optional().default(''),
  type: z.string().trim().max(80).optional(),
  features: z.string().optional().transform((value, context) => {
    if (!value) return [];
    const parsed = value.split(',').map((item) => item.trim()).filter(Boolean);
    const result = z.array(destinationFeatureSchema).max(4).safeParse(parsed);
    if (!result.success) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Filter aksesibilitas tidak valid.' });
      return z.NEVER;
    }
    return result.data;
  }),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export type SearchDestinationsInput = z.infer<typeof searchDestinationsSchema>;
