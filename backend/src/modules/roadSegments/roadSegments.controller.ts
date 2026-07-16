import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { addRoadSegmentCondition, getRoadSegmentById, listRoadSegments } from './roadSegments.service';

export const addCondition = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = (req.file as Express.Multer.File & { path?: string })?.path;
  const result = await addRoadSegmentCondition(req.user!.userId, req.body, photoUrl);
  return created(res, result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radiusMeters } = req.query as any;
  const segments = await listRoadSegments(lat, lng, radiusMeters);
  if (Array.isArray(segments) && segments.length === 0) {
    return empty(res, 'Belum ada data segmen jalan di area ini.');
  }
  return ok(res, segments);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const segment = await getRoadSegmentById(req.params.id);
  return ok(res, segment);
});
