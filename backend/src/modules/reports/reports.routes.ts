import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { uploadReportPhoto } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';

import {
  createReportSchema,
  listReportsSchema,
  verifyReportSchema,
} from './reports.schema';

import {
  create,
  getById,
  getGuest,
  list,
  map,
  verify,
} from './reports.controller';

const router = Router();


router.post(
  '/',
  authenticate,
  uploadReportPhoto.single('photo'),
  validate(createReportSchema),
  create,
);


router.get(
  '/',
  validate(listReportsSchema, 'query'),
  list,
);

// Public map layer. Must stay before /:id so "map" is not parsed as an id.
router.get('/map', map);
router.get('/guest/:accessKey', getGuest);


router.get('/:id', getById);


router.post(
  '/:id/verify',
  authenticate,
  validate(verifyReportSchema),
  verify,
);

export default router;
