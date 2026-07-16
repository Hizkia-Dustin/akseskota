import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { empty, ok } from '../../utils/apiResponse';
import { deleteUser, getSystemStatistics, listUsers, updateUserRole } from './admin.service';

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await listUsers((req.query as any).role);
  if (users.length === 0) return empty(res, 'Belum ada pengguna.');
  return ok(res, users);
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await updateUserRole(req.params.id, req.body.role);
  return ok(res, user);
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await deleteUser(req.params.id);
  return ok(res, result);
});

export const statistics = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getSystemStatistics();
  return ok(res, stats);
});
