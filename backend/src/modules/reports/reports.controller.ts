import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';
import { deletePersistedPhoto, persistUploadedPhoto } from '../../middlewares/upload';

import {
  createReport,
  getReportById,
  getGuestReport,
  listMapReports,
  listReports,
  submitCommunityVerification,
} from './reports.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error('Foto wajib diupload.');
  }

  const photoUrl = await persistUploadedPhoto(req);
  try {
    const report = await createReport({
      userId: req.user?.userId,
      title: req.body.title,
      targetType: req.body.targetType,
      roadSegmentId: req.body.roadSegmentId,
      obstacleId: req.body.obstacleId,
      facilityId: req.body.facilityId,
      description: req.body.description,
      photoUrl: photoUrl!,
    });
    return created(res, report);
  } catch (error) {
    await deletePersistedPhoto(photoUrl);
    throw error;
  }
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const reports = await listReports(req.query as any);

  if (reports.length === 0) {
    return empty(res, 'Belum ada laporan.');
  }

  return ok(res, reports);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const report = await getReportById(req.params.id);
  return ok(res, report);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const { action, note } = req.body;

  const verification = await submitCommunityVerification(
    req.params.id,
    req.user!.userId,
    action,
    note,
  );

  return created(res, verification);
});

export const getGuest = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await getGuestReport(req.params.accessKey));
});

export const map = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await listMapReports());
});
