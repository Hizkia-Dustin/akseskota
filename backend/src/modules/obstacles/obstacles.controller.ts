import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { listObstacles, reportObstacle } from './obstacles.service';

export const report = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = (req.file as Express.Multer.File & { path?: string })?.path;
  const result = await reportObstacle(req.user!.userId, req.body, photoUrl);
  return created(res, result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = req.query.activeOnly !== 'false';
  const obstacles = await listObstacles(activeOnly);
  if (obstacles.length === 0) return empty(res, 'Tidak ada hambatan yang dilaporkan saat ini.');
  return ok(res, obstacles);
});
