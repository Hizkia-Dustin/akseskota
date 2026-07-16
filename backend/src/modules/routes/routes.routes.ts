import { Router } from 'express';
import { optionalAuthenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { searchRouteSchema } from './routes.schema';
import { detail, search } from './routes.controller';

const router = Router();

// Optional auth: logged-in users get personalized weights/mode (F002),
// guests can still search with an explicit ?mode= query param.
router.get('/', optionalAuthenticate, validate(searchRouteSchema, 'query'), search);
router.get('/:searchId/:routeId', optionalAuthenticate, detail);

export default router;
