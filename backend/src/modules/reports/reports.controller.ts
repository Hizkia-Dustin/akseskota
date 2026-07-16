import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, empty, ok } from '../../utils/apiResponse';

import {
  createReport,
  getReportById,
  listReports,
  submitCommunityVerification,
} from './reports.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error('Foto wajib diupload.');
  }

  const report = await createReport({
    userId: req.user!.userId,
    targetType: req.body.targetType,
    roadSegmentId: req.body.roadSegmentId,
    obstacleId: req.body.obstacleId,
    facilityId: req.body.facilityId,
    description: req.body.description,

    // URL Cloudinary
    photoUrl: (req.file as any).path,
  });

  return created(res, report);
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