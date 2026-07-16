import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { getUrbanInsightData, getWalkabilityData } from './dashboard.service';

export const walkability = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getWalkabilityData();
  return ok(res, data);
});

export const urbanInsight = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getUrbanInsightData();
  return ok(res, data);
});
