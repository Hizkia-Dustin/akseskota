import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { SaveRouteHistoryInput } from './routeHistory.schema';

export async function listRouteHistory(userId: string) {
  return prisma.routeHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getRouteHistoryById(userId: string, routeId: string) {
  const route = await prisma.routeHistory.findFirst({ where: { id: routeId, userId } });
  if (!route) {
    throw new ApiError(404, 'Riwayat rute tidak ditemukan.');
  }
  return route;
}

export async function saveRouteHistory(userId: string, input: SaveRouteHistoryInput) {
  return prisma.routeHistory.create({
    data: {
      userId,
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      mode: (input.mode ?? 'GENERAL') as any,
      chosenRouteJson: input.chosenRouteJson as any,
    },
  });
}
