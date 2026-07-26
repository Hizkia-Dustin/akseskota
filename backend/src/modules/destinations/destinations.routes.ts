import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { getByExternalId, search } from './destinations.controller';
import { searchDestinationsSchema } from './destinations.schema';

const router = Router();

router.get('/', validate(searchDestinationsSchema, 'query'), search);
router.get('/:externalId', getByExternalId);

export default router;
