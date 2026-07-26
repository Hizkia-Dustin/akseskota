import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { createFavoriteRoute, deleteFavoriteRoute, listFavoriteRoutes } from './favorites.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const routes = await listFavoriteRoutes(req.user!.userId);
  if (routes.length === 0) return empty(res, 'Belum ada rute favorit.');
  return ok(res, routes);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const route = await createFavoriteRoute(req.user!.userId, req.body);
  return created(res, route);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteFavoriteRoute(req.user!.userId, req.params.id);
  return ok(res, result);
});
