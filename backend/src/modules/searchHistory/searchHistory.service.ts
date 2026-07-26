import { prisma } from '../../config/prisma';
import { SearchHistoryInput } from './searchHistory.schema';

export async function listSearchHistory(userId: string) {
  return prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function saveSearchHistory(userId: string, input: SearchHistoryInput) {
  return prisma.searchHistory.create({
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
