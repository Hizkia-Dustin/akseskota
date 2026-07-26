import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { getRouteHistoryById, listRouteHistory, saveRouteHistory } from './routeHistory.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const history = await listRouteHistory(req.user!.userId);
  if (history.length === 0) return empty(res, 'Belum ada riwayat rute.');
  return ok(res, history);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const history = await getRouteHistoryById(req.user!.userId, req.params.id);
  return ok(res, history);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const history = await saveRouteHistory(req.user!.userId, req.body);
  return created(res, history);
});
