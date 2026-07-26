import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { empty, ok } from '../../utils/apiResponse';
import { listNotifications, markAllNotificationsRead, readNotification } from './notifications.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await listNotifications(req.user!.userId);
  if (notifications.length === 0) return empty(res, 'Belum ada notifikasi.');
  return ok(res, notifications);
});

export const read = asyncHandler(async (req: Request, res: Response) => {
  const notification = await readNotification(req.user!.userId, req.params.id);
  return ok(res, notification);
});

export const readAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await markAllNotificationsRead(req.user!.userId);
  return ok(res, result);
});
