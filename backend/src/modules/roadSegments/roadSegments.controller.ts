import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { addRoadSegmentCondition, getRoadSegmentById, listRoadSegments } from './roadSegments.service';
import { deletePersistedPhoto, persistUploadedPhoto } from '../../middlewares/upload';

export const addCondition = asyncHandler(async (req: Request, res: Response) => {
  const photoUrl = await persistUploadedPhoto(req, 'road-segments');
  try {
    const result = await addRoadSegmentCondition(req.user!.userId, req.body, photoUrl);
    return created(res, result);
  } catch (error) {
    await deletePersistedPhoto(photoUrl);
    throw error;
  }
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
