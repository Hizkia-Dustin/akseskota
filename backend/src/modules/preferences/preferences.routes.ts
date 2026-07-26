import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { updatePreferencesSchema } from './preferences.schema';
import { get, update } from './preferences.controller';

const router = Router();

router.use(authenticate);
router.get('/me/preferences', get);
router.put('/me/preferences', validate(updatePreferencesSchema), update);

export default router;
