import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { getDestination, searchDestinations } from './destinations.service';

export const search = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await searchDestinations(req.query as never));
});

export const getByExternalId = asyncHandler(async (req: Request, res: Response) => {
  const destination = await getDestination(req.params.externalId);
  if (!destination) return res.status(404).json({ success: false, message: 'Destinasi tidak ditemukan.' });
  return ok(res, destination);
});
