import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { createFacilitySchema, listFacilitiesSchema } from './facilities.schema';
import { create, getById, list } from './facilities.controller';

const router = Router();

router.get('/', validate(listFacilitiesSchema, 'query'), list);
router.get('/:id', getById);
// Facility master data is curated by admin/moderator (not free-for-all
// citizen input like obstacles/road segments), per Admin Panel F020.
router.post('/', authenticate, authorize('ADMIN', 'MODERATOR'), validate(createFacilitySchema), create);

export default router;
