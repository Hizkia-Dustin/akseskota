import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { uploadReportPhoto } from '../../middlewares/upload';
import { addRoadSegmentSchema, listRoadSegmentsSchema } from './roadSegments.schema';
import { addCondition, getById, list } from './roadSegments.controller';

const router = Router();

router.get('/', validate(listRoadSegmentsSchema, 'query'), list);
router.get('/:id', getById);
router.post(
  '/',
  authenticate,
  uploadReportPhoto.single('photo'),
  validate(addRoadSegmentSchema),
  addCondition,
);

export default router;
