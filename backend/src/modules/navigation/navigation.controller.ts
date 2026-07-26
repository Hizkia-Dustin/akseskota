import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/apiResponse';
import { finishNavigation, startNavigation } from './navigation.service';

export const start = asyncHandler(async (req: Request, res: Response) => {
  const session = await startNavigation(req.user!.userId, req.body);
  return created(res, session);
});

export const finish = asyncHandler(async (req: Request, res: Response) => {
  const session = await finishNavigation(req.user!.userId, req.body);
  return ok(res, session);
});
