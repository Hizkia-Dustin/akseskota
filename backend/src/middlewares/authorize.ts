import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/apiResponse';

type Role = 'USER' | 'MODERATOR' | 'ADMIN';

// Role-based access control, per System Architecture section 4 & 13.
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return fail(res, 401, 'Silakan login terlebih dahulu.');
    }
    if (!allowedRoles.includes(req.user.role)) {
      return fail(res, 403, 'Anda tidak memiliki akses untuk aksi ini.');
    }
    next();
  };
}
