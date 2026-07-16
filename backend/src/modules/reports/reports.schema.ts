import { z } from 'zod';

export const createReportSchema = z.object({
  title: z.string().trim().min(4).max(100),
  targetType: z.enum([
    'ROAD_SEGMENT',
    'OBSTACLE',
    'FACILITY',
  ]),

  roadSegmentId: z.string().uuid().optional(),

  obstacleId: z.string().uuid().optional(),

  facilityId: z.string().uuid().optional(),

  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional(),
});

export const listReportsSchema = z.object({
  status: z
    .enum([
      'UNVERIFIED',
      'VERIFIED',
      'REJECTED',
      'NEEDS_RECHECK',
    ])
    .optional(),

  targetType: z
    .enum([
      'ROAD_SEGMENT',
      'OBSTACLE',
      'FACILITY',
    ])
    .optional(),
});

export const verifyReportSchema = z.object({
  action: z.enum([
    'VERIFIED',
    'REJECTED',
    'NEEDS_RECHECK',
  ]),
  note: z.string().optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
