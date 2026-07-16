import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/apiResponse';
import { loginUser, refreshAccessToken, registerUser } from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  return created(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  return ok(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = refreshAccessToken(req.body.refreshToken);
  return ok(res, result);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // Stateless JWT: logout is handled client-side by discarding tokens.
  // If token revocation is needed later, add a token-blacklist table.
  return ok(res, { message: 'Berhasil logout.' });
});
