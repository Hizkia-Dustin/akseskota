import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { favoriteRouteSchema } from './favorites.schema';
import { create, list, remove } from './favorites.controller';

const router = Router();

router.use(authenticate);
router.get('/', list);
router.post('/', validate(favoriteRouteSchema), create);
router.delete('/:id', remove);

export default router;
