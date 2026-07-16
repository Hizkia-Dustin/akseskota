import { z } from 'zod';

export const moderateReportSchema = z.object({
  note: z.string().optional(),
});

export const mergeDuplicateSchema = z.object({
  primaryReportId: z.string().uuid(),
  duplicateReportId: z.string().uuid(),
});
