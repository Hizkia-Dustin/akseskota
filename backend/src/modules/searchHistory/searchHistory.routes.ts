import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { searchHistorySchema } from './searchHistory.schema';
import { create, list } from './searchHistory.controller';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.post('/', validate(searchHistorySchema), create);

export default router;
