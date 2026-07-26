import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { getLeaderboard } from './leaderboard.service';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const leaderboard = await getLeaderboard();
  return ok(res, leaderboard);
});
