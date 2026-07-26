import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { FavoriteRouteInput } from './favorites.schema';

export async function listFavoriteRoutes(userId: string) {
  return prisma.favoriteRoute.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFavoriteRoute(userId: string, input: FavoriteRouteInput) {
  return prisma.favoriteRoute.create({
    data: {
      userId,
      name: input.name ?? 'Favorit',
      originLat: input.originLat,
      originLng: input.originLng,
      destLat: input.destLat,
      destLng: input.destLng,
      mode: (input.mode ?? 'GENERAL') as any,
      routeJson: input.routeJson as any,
    },
  });
}

export async function deleteFavoriteRoute(userId: string, routeId: string) {
  const route = await prisma.favoriteRoute.findFirst({ where: { id: routeId, userId } });
  if (!route) {
    throw new ApiError(404, 'Favorit rute tidak ditemukan.');
  }

  await prisma.favoriteRoute.delete({ where: { id: routeId } });
  return { deleted: true };
}
