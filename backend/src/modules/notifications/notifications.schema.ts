import { z } from 'zod';

export const notificationReadSchema = z.object({
  id: z.string().uuid(),
});

export type NotificationReadInput = z.infer<typeof notificationReadSchema>;
