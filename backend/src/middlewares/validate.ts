import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { fail } from '../utils/apiResponse';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, source: Source = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return fail(res, 422, 'Validasi input gagal.', result.error.flatten());
    }
    req[source] = result.data;
    next();
  };
}
