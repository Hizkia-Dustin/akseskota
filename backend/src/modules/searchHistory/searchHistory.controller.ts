import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { empty, ok, created } from '../../utils/apiResponse';
import { listSearchHistory, saveSearchHistory } from './searchHistory.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const history = await listSearchHistory(req.user!.userId);
  if (history.length === 0) return empty(res, 'Belum ada riwayat pencarian.');
  return ok(res, history);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await saveSearchHistory(req.user!.userId, req.body);
  return created(res, item);
});
