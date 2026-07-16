import { Response } from 'express';

// Consistent envelope so frontend can rely on the same shape for every
// endpoint: loading/empty/error/success states (Feature Spec section 5).
export function ok(res: Response, data: unknown, meta?: Record<string, unknown>) {
  return res.status(200).json({ success: true, data, meta: meta ?? null });
}

export function created(res: Response, data: unknown) {
  return res.status(201).json({ success: true, data });
}

export function empty(res: Response, message = 'Tidak ada data ditemukan') {
  return res.status(200).json({ success: true, data: [], message });
}

export function fail(res: Response, status: number, message: string, errors?: unknown) {
  return res.status(status).json({ success: false, message, errors: errors ?? null });
}
