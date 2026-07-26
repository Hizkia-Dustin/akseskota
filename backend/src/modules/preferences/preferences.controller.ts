import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { getMyPreferences, updateMyPreferences } from './preferences.service';

export const get = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await getMyPreferences(req.user!.userId);
  return ok(res, preferences);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const preferences = await updateMyPreferences(req.user!.userId, req.body);
  return ok(res, preferences);
});
