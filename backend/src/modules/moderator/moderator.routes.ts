import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { mergeDuplicateSchema, moderateReportSchema } from './moderator.schema';
import { approve, mergeDuplicate, needsRecheck, queue, reject } from './moderator.controller';

const router = Router();

router.use(authenticate, authorize('MODERATOR', 'ADMIN'));
router.get('/queue', queue);
router.patch('/reports/:id/approve', validate(moderateReportSchema), approve);
router.patch('/reports/:id/reject', validate(moderateReportSchema), reject);
router.patch('/reports/:id/needs-recheck', validate(moderateReportSchema), needsRecheck);
router.post('/reports/merge', validate(mergeDuplicateSchema), mergeDuplicate);

export default router;
