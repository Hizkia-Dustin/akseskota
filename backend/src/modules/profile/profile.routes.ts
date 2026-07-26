import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { updateProfileSchema } from './profile.schema';
import { get, update } from './profile.controller';

const router = Router();

router.use(authenticate);
router.get('/me', get);
router.put('/me', validate(updateProfileSchema), update);

export default router;
