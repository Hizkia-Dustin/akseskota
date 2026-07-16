import { NextFunction, Request, Response } from 'express';
import { fail } from '../utils/apiResponse';

export class ApiError extends Error {
  status: number;
  errors?: unknown;
  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Keep this as the LAST middleware registered in app.ts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return fail(res, err.status, err.message, err.errors);
  }

  console.error('[Unhandled Error]', err);
  return fail(res, 500, 'Terjadi kesalahan pada server. Silakan coba lagi nanti.');
}

export function notFoundHandler(req: Request, res: Response) {
  return fail(res, 404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`);
}
