import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { urbanInsight, walkability } from './dashboard.controller';

const router = Router();

// F016 - Walkability Dashboard: public-ish summary, visible to any logged-in user.
router.get('/walkability', authenticate, walkability);
// F017 - Urban Insight Dashboard: for government/admin/moderator only.
router.get('/urban-insight', authenticate, authorize('ADMIN', 'MODERATOR'), urbanInsight);

export default router;
