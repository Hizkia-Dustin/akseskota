import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { uploadReportPhoto } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import {
  createContribution,
  createPost,
  getByExternalId,
  listContributions,
  search,
  voteContribution,
} from './communityPlaces.controller';
import {
  createDirectoryContributionSchema,
  createPlacePostSchema,
  listDirectoryContributionsSchema,
  searchCommunityPlacesSchema,
  voteDirectoryContributionSchema,
} from './communityPlaces.schema';

const router = Router();

router.get('/', validate(searchCommunityPlacesSchema, 'query'), search);
router.get('/external/:externalId', getByExternalId);
router.post('/posts', authenticate, uploadReportPhoto.single('photo'), validate(createPlacePostSchema), createPost);
router.get('/contributions', validate(listDirectoryContributionsSchema, 'query'), listContributions);
router.post('/contributions', authenticate, uploadReportPhoto.single('photo'), validate(createDirectoryContributionSchema), createContribution);
router.post('/contributions/:id/votes', authenticate, validate(voteDirectoryContributionSchema), voteContribution);

export default router;
