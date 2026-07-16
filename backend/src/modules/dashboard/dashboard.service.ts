import { prisma } from '../../config/prisma';

// F016 - Walkability Dashboard: red/yellow/green area visualization based
// on aggregated accessibility/comfort/safety of road segments.
export async function getWalkabilityData() {
  const segments = await prisma.roadSegment.findMany({
    select: {
      id: true,
      accessibilityScore: true,
      comfortScore: true,
    },
  });

  const classify = (score: number | null) => {
    if (score === null) return 'unknown';
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const summary = { green: 0, yellow: 0, red: 0, unknown: 0 };
  const segmentClassification = segments.map((s) => {
    const combined =
      s.accessibilityScore !== null && s.comfortScore !== null
        ? (s.accessibilityScore + s.comfortScore) / 2
        : s.accessibilityScore ?? s.comfortScore ?? null;
    const bucket = classify(combined);
    summary[bucket as keyof typeof summary] += 1;
    return { id: s.id, score: combined, bucket };
  });

  return { totalSegments: segments.length, summary, segments: segmentClassification };
}

// F017 - Urban Insight Dashboard (untuk pemerintah): hambatan terbanyak,
// area prioritas, segmen minim keteduhan, ramp/guiding block rusak.
export async function getUrbanInsightData() {
  const [obstacleCounts, lowShadeSegments, damagedFacilities, unverifiedReportsCount] = await Promise.all([
    prisma.obstacle.groupBy({
      by: ['type'],
      where: { isActive: true },
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } },
    }),
    prisma.roadSegment.findMany({
      where: { shadeLevel: { lt: 30 } },
      select: { id: true, shadeLevel: true },
      orderBy: { shadeLevel: 'asc' },
      take: 20,
    }),
    prisma.facility.findMany({
      where: { condition: 'damaged' },
      select: { id: true, type: true, name: true },
    }),
    prisma.report.count({ where: { verificationStatus: 'UNVERIFIED' } }),
  ]);

  return {
    mostCommonObstacles: obstacleCounts.map((o) => ({ type: o.type, count: o._count.type })),
    lowShadeSegments,
    damagedFacilities,
    pendingReportsCount: unverifiedReportsCount,
  };
}
