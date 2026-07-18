import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(80),
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(191),
  password: z.string().min(10, 'Password minimal 10 karakter').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid').max(191),
  password: z.string().min(1, 'Password wajib diisi').max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token wajib diisi'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
