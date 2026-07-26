import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { list } from './leaderboard.controller';

const router = Router();

router.use(authenticate);
router.get('/', list);

export default router;
