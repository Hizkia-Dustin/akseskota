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
  list,
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


router.get('/:id', getById);


router.post(
  '/:id/verify',
  authenticate,
  validate(verifyReportSchema),
  verify,
);

export default router;