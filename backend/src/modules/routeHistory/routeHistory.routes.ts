import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { saveRouteHistorySchema } from './routeHistory.schema';
import { create, getById, list } from './routeHistory.controller';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.get('/:id', getById);
router.post('/', validate(saveRouteHistorySchema), create);

export default router;
