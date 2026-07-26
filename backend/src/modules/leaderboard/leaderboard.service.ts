import { prisma } from '../../config/prisma';

export async function getLeaderboard() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      _count: { select: { reports: true, routeHistory: true } },
    },
    orderBy: [{ reports: { _count: 'desc' } }, { routeHistory: { _count: 'desc' } }],
    take: 10,
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    reportsCount: user._count.reports,
    routeHistoryCount: user._count.routeHistory,
    contributionScore: user._count.reports + user._count.routeHistory,
  }));
}
