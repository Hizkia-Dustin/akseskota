import { generateCandidateRoutes } from './generateCandidates';
import { applyAccessibilityFilter } from './accessibilityFilter';
import { computeComfortScore } from './comfortScoring';
import { applyLiveConditionFilter } from './liveConditionFilter';
import { buildLabels, explainRoute } from './explainRoute';
import { PersonalMode, PreferenceWeights, ScoredRoute } from './types';

export interface RecommendRoutesInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  mode: PersonalMode;
  weights: PreferenceWeights;
}

const DEFAULT_WALK_SPEED_M_PER_MIN = 60; // ~3.6 km/h, conservative for mixed-mobility users

/**
 * Full pipeline per System Architecture section 7:
 * candidates -> Accessibility Filter (hard) -> Comfort Scoring (soft)
 * -> Live Condition Filter -> ranked recommendation with explanations.
 */
export async function recommendRoutes(input: RecommendRoutesInput): Promise<{
  routes: ScoredRoute[];
  eliminated: { id: string; reason: string }[];
}> {
  const candidates = await generateCandidateRoutes(
    input.originLat,
    input.originLng,
    input.destLat,
    input.destLng,
  );

  const eliminated: { id: string; reason: string }[] = [];
  const survivors: ScoredRoute[] = [];

  for (const candidate of candidates) {
    // 1. Hard constraint
    const accessResult = applyAccessibilityFilter(candidate, input.mode);
    if (!accessResult.passed) {
      eliminated.push({ id: candidate.id, reason: accessResult.reason || 'Tidak memenuhi accessibility constraint' });
      continue;
    }

    // 2. Live condition (can also reject if actively blocked)
    const liveResult = applyLiveConditionFilter(candidate);
    if (!liveResult.passed) {
      eliminated.push({ id: candidate.id, reason: liveResult.reason || 'Diblokir kondisi aktual jalur' });
      continue;
    }

    // 3. Comfort (soft, weighted)
    const comfort = computeComfortScore(candidate, input.weights);

    const safety = Math.max(0, 100 - liveResult.safetyPenalty);
    const durationMinutes = Math.max(1, Math.round(candidate.distanceMeters / DEFAULT_WALK_SPEED_M_PER_MIN));

    survivors.push({
      id: candidate.id,
      distanceMeters: Math.round(candidate.distanceMeters),
      durationMinutes,
      accessibility: accessResult.score,
      comfort,
      safety,
      reasons: explainRoute(candidate, input.mode, liveResult.activeObstacleCount),
      labels: [],
    });
  }

  const labels = buildLabels(survivors);
  survivors.forEach((r) => (r.labels = labels.get(r.id) ?? []));

  // Rank: accessibility already guaranteed to pass hard constraint for all
  // survivors, so sort by a blended score for default ordering.
  survivors.sort((a, b) => b.accessibility * 0.4 + b.comfort * 0.35 + b.safety * 0.25 -
    (a.accessibility * 0.4 + a.comfort * 0.35 + a.safety * 0.25));

  return { routes: survivors, eliminated };
}
