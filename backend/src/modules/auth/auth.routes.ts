import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { loginSchema, refreshSchema, registerSchema } from './auth.schema';
import { login, logout, refresh, register } from './auth.controller';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';

const router = Router();
const authLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan autentikasi. Coba lagi nanti.' },
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/logout', logout);

export default router;
