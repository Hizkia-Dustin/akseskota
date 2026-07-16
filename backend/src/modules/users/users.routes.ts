import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { updatePreferencesSchema } from './users.schema';
import { getContributions, getProfile, getRouteHistory, updatePreferences } from './users.controller';

const router = Router();

router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me/preferences', validate(updatePreferencesSchema), updatePreferences);
router.get('/me/contributions', getContributions);
router.get('/me/route-history', getRouteHistory);

export default router;
