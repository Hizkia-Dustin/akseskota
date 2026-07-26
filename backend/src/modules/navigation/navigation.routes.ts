import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { finishNavigationSchema, startNavigationSchema } from './navigation.schema';
import { finish, start } from './navigation.controller';

const router = Router();

router.use(authenticate);
router.post('/start', validate(startNavigationSchema), start);
router.post('/finish', validate(finishNavigationSchema), finish);

export default router;
