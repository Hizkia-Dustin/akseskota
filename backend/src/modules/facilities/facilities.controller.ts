import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { createFacility, getFacilityById, listFacilities } from './facilities.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const facility = await createFacility(req.body);
  return created(res, facility);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const facilities = await listFacilities(req.query as any);
  if (Array.isArray(facilities) && facilities.length === 0) {
    return empty(res, 'Belum ada data fasilitas di area ini.');
  }
  return ok(res, facilities);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const facility = await getFacilityById(req.params.id);
  return ok(res, facility);
});
