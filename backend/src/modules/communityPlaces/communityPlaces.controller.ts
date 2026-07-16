import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/apiResponse';
import { persistUploadedPhoto } from '../../middlewares/upload';
import { createCommunityPlacePost, getCommunityPlace, searchCommunityPlaces } from './communityPlaces.service';

export const getByExternalId = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await getCommunityPlace(req.params.externalId));
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await searchCommunityPlaces(req.query as any));
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = req.file ? await persistUploadedPhoto(req) : undefined;
  return created(res, await createCommunityPlacePost(req.user!.userId, req.body, photoUrl));
});
