import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { getMyProfile, updateMyProfile } from './profile.service';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getMyProfile(req.user!.userId);
  return ok(res, profile);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const profile = await updateMyProfile(req.user!.userId, req.body);
  return ok(res, profile);
});
