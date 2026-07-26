import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { googleSchema, loginSchema, refreshSchema, registerSchema } from './auth.schema';
import { google, login, logout, refresh, register } from './auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleSchema), google);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);

export default router;
