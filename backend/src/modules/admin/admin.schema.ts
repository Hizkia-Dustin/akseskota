import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
});

export const listUsersSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']).optional(),
});
