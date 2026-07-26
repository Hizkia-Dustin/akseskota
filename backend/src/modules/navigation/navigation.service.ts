import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { FinishNavigationInput, StartNavigationInput } from './navigation.schema';

export async function startNavigation(userId: string, input: StartNavigationInput) {
  return prisma.navigationSession.create({
    data: {
      userId,
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      mode: (input.mode ?? 'GENERAL') as any,
    },
  });
}

export async function finishNavigation(userId: string, input: FinishNavigationInput) {
  const session = await prisma.navigationSession.findFirst({
    where: { id: input.sessionId, userId },
  });

  if (!session) {
    throw new ApiError(404, 'Sesi navigasi tidak ditemukan.');
  }

  return prisma.navigationSession.update({
    where: { id: input.sessionId },
    data: {
      finishedAt: new Date(),
      distanceMeters: input.distanceMeters ?? session.distanceMeters ?? null,
      durationSeconds: input.durationSeconds ?? session.durationSeconds ?? null,
    },
  });
}
