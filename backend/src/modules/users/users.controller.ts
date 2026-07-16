import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { createMyRouteHistory, getMyContributions, getMyProfile, getMyRouteHistory, updateMyPreferences } from './users.service';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getMyProfile(req.user!.userId);
  return ok(res, profile);
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const prefs = await updateMyPreferences(req.user!.userId, req.body);
  return ok(res, prefs);
});

export const getContributions = asyncHandler(async (req: Request, res: Response) => {
  const result = await getMyContributions(req.user!.userId);
  if (result.total === 0) return empty(res, 'Belum ada kontribusi.');
  return ok(res, result);
});

export const getRouteHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await getMyRouteHistory(req.user!.userId);
  if (history.length === 0) return empty(res, 'Belum ada riwayat perjalanan.');
  return ok(res, history);
});

export const createRouteHistory = asyncHandler(async (req: Request, res: Response) => {
  return created(res, await createMyRouteHistory(req.user!.userId, req.body));
});
