import { CandidateRoute, PersonalMode } from './types';
import { shadePercentOfRoute } from './comfortScoring';

/**
 * F007 - Route Explanation: system must explain WHY a route is
 * recommended, not just show a score. Reasons are generated from the same
 * underlying data used for scoring so they never contradict the numbers.
 */
export function explainRoute(route: CandidateRoute, mode: PersonalMode, obstacleCount: number): string[] {
  const reasons: string[] = [];

  const hasAnyStairsBlocked = route.segments.some((s) => s.hasStairs && !s.hasRamp);
  if ((mode === 'WHEELCHAIR' || mode === 'STROLLER') && !hasAnyStairsBlocked) {
    reasons.push('Tidak memiliki tangga tanpa ramp');
  }

  const rampRatio = route.segments.filter((s) => s.hasRamp).length / Math.max(1, route.segments.length);
  if (rampRatio >= 0.5) {
    reasons.push('Memiliki ramp di sebagian besar jalur');
  }

  const shadePercent = shadePercentOfRoute(route);
  if (shadePercent > 0) {
    reasons.push(`${shadePercent}% jalur teduh`);
  }

  const guidingBlockRatio =
    route.segments.filter((s) => s.hasGuidingBlock).length / Math.max(1, route.segments.length);
  if (mode === 'LOW_VISION' && guidingBlockRatio >= 0.5) {
    reasons.push('Sebagian besar jalur memiliki guiding block');
  }

  const seatingCount = route.segments.filter((s) =>
    s.nearbyFacilities.some((f) => f.type === 'BENCH' || f.type === 'SHELTER'),
  ).length;
  if (mode === 'ELDERLY' && seatingCount > 0) {
    reasons.push(`${seatingCount} titik istirahat tersedia di sepanjang rute`);
  }

  if (obstacleCount === 0) {
    reasons.push('Tidak ada hambatan aktif yang dilaporkan saat ini');
  } else {
    reasons.push(`${obstacleCount} kondisi minor dilaporkan, masih dapat dilalui`);
  }

  return reasons;
}

export function buildLabels(routes: { id: string; distanceMeters: number; accessibility: number; comfort: number }[]) {
  const labels = new Map<string, string[]>();
  routes.forEach((r) => labels.set(r.id, []));

  if (routes.length === 0) return labels;

  const mostAccessible = [...routes].sort((a, b) => b.accessibility - a.accessibility)[0];
  labels.get(mostAccessible.id)?.push('Paling aksesibel');

  const shortest = [...routes].sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
  labels.get(shortest.id)?.push('Paling pendek');

  const mostComfortable = [...routes].sort((a, b) => b.comfort - a.comfort)[0];
  labels.get(mostComfortable.id)?.push('Paling nyaman');
  labels.get(mostComfortable.id)?.push('Paling teduh');

  return labels;
}
