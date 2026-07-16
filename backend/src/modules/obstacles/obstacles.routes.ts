import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { uploadReportPhoto } from '../../middlewares/upload';
import { env } from '../../config/env';
import { listObstaclesSchema, reportObstacleSchema } from './obstacles.schema';
import { list, report } from './obstacles.controller';

const router = Router();

// Rate limit laporan per System Architecture section 13.
const reportLimiter = rateLimit({
  windowMs: env.reportRateLimit.windowMs,
  max: env.reportRateLimit.max,
  message: { success: false, message: 'Terlalu banyak laporan. Coba lagi nanti.' },
});

router.get('/', validate(listObstaclesSchema, 'query'), list);
router.post(
  '/',
  authenticate,
  reportLimiter,
  uploadReportPhoto.single('photo'),
  validate(reportObstacleSchema),
  report,
);

export default router;
