import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { empty, ok } from '../../utils/apiResponse';
import { evaluateMapboxRoutes, getRouteDetail, searchRoutes } from './routes.service';

// F004/F005 - Search Route + Route Comparison combined in one response,
// since the comparison view needs all candidates at once.
export const search = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchRoutes(req.query as any, req.user?.userId);
  if (result.routes.length === 0) {
    return empty(res, 'Tidak ditemukan rute yang sesuai untuk lokasi dan mode ini.');
  }
  return ok(res, result);
});

// F006 - Route Detail
export const detail = asyncHandler(async (req: Request, res: Response) => {
  const { searchId, routeId } = req.params;
  const route = await getRouteDetail(searchId, routeId);
  return ok(res, route);
});

export const evaluate = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await evaluateMapboxRoutes(req.body));
});
