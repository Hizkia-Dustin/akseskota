import { CandidateRoute, PreferenceWeights } from './types';

/**
 * Soft Preference layer (System Architecture section 9 / Product Guide
 * Layer 2 "Comfort", originating from the TeduhKota concept). Only runs on
 * routes that already passed the Accessibility hard constraint.
 */
export function computeComfortScore(route: CandidateRoute, weights: PreferenceWeights): number {
  if (route.segments.length === 0) return 0;

  let shadeSum = 0;
  let seatingHits = 0;
  let lightingHits = 0;

  for (const s of route.segments) {
    shadeSum += s.shadeLevel ?? 0;
    if (s.nearbyFacilities.some((f) => f.type === 'BENCH' || f.type === 'SHELTER')) seatingHits += 1;
    if (s.lightingAvailable) lightingHits += 1;
  }

  const n = route.segments.length;
  const avgShade = shadeSum / n; // 0-100
  const seatingRatio = (seatingHits / n) * 100;
  const lightingRatio = (lightingHits / n) * 100;

  // Distance component: shorter route among candidates scores higher.
  // Normalized later at the recommendation-set level (see recommend.ts);
  // here we just return the raw weighted comfort sub-score.
  const weightedSum =
    avgShade * weights.shadeWeight + seatingRatio * weights.seatingWeight + lightingRatio * weights.lightingWeight;

  const weightTotal = weights.shadeWeight + weights.seatingWeight + weights.lightingWeight;
  return weightTotal > 0 ? Math.round(weightedSum / weightTotal) : Math.round((avgShade + seatingRatio + lightingRatio) / 3);
}

export function shadePercentOfRoute(route: CandidateRoute): number {
  if (route.segments.length === 0) return 0;
  const shaded = route.segments.filter((s) => (s.shadeLevel ?? 0) >= 50).length;
  return Math.round((shaded / route.segments.length) * 100);
}
