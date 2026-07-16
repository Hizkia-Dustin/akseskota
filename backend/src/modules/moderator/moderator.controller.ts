import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { empty, ok } from '../../utils/apiResponse';
import { approveReport, getVerificationQueue, mergeDuplicateReports, rejectReport } from './moderator.service';

export const queue = asyncHandler(async (_req: Request, res: Response) => {
  const reports = await getVerificationQueue();
  if (reports.length === 0) return empty(res, 'Antrian verifikasi kosong.');
  return ok(res, reports);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const report = await approveReport(req.params.id, req.user!.userId, req.body.note);
  return ok(res, report);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const report = await rejectReport(req.params.id, req.user!.userId, req.body.note);
  return ok(res, report);
});

export const mergeDuplicate = asyncHandler(async (req: Request, res: Response) => {
  const result = await mergeDuplicateReports(req.body.primaryReportId, req.body.duplicateReportId, req.user!.userId);
  return ok(res, result);
});
