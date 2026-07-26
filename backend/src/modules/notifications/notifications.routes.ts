import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { readAll, list, read } from './notifications.controller';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.post('/read-all', readAll);
router.patch('/:id/read', read);

export default router;
