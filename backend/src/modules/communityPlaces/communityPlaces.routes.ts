import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { uploadReportPhoto } from '../../middlewares/upload';
import { validate } from '../../middlewares/validate';
import { createPost, getByExternalId, search } from './communityPlaces.controller';
import { createPlacePostSchema, searchCommunityPlacesSchema } from './communityPlaces.schema';

const router = Router();

router.get('/', validate(searchCommunityPlacesSchema, 'query'), search);
router.get('/external/:externalId', getByExternalId);
router.post('/posts', authenticate, uploadReportPhoto.single('photo'), validate(createPlacePostSchema), createPost);

export default router;
