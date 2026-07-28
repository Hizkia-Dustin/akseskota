import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/apiResponse';
import { deletePersistedPhoto, persistUploadedPhoto } from '../../middlewares/upload';
import {
  createCommunityPlacePost,
  createDirectoryContribution,
  getCommunityPlace,
  listDirectoryContributions,
  searchCommunityPlaces,
  voteDirectoryContribution,
} from './communityPlaces.service';

export const getByExternalId = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await getCommunityPlace(req.params.externalId));
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await searchCommunityPlaces(req.query as any));
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = req.file ? await persistUploadedPhoto(req) : undefined;
  try {
    return created(res, await createCommunityPlacePost(req.user!.userId, req.body, photoUrl));
  } catch (error) {
    await deletePersistedPhoto(photoUrl);
    throw error;
  }
});

export const listContributions = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await listDirectoryContributions(req.query as any));
});

export const createContribution = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = req.file ? await persistUploadedPhoto(req, 'directory-evidence') : undefined;
  try {
    return created(res, await createDirectoryContribution(req.user!.userId, req.body, photoUrl));
  } catch (error) {
    await deletePersistedPhoto(photoUrl);
    throw error;
  }
});

export const voteContribution = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await voteDirectoryContribution(req.user!.userId, req.params.id, req.body));
});
