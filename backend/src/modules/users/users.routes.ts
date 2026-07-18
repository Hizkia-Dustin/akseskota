import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { createRouteHistorySchema, updatePreferencesSchema } from './users.schema';
import { createRouteHistory, deleteRouteHistory, getContributions, getProfile, getRouteHistory, updatePreferences } from './users.controller';

const router = Router();

router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me/preferences', validate(updatePreferencesSchema), updatePreferences);
router.get('/me/contributions', getContributions);
router.get('/me/route-history', getRouteHistory);
router.post('/me/route-history', validate(createRouteHistorySchema), createRouteHistory);
router.delete('/me/route-history/:id', deleteRouteHistory);

export default router;
