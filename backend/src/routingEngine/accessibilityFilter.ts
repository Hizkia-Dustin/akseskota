import { CandidateRoute, PersonalMode } from './types';

export interface AccessibilityResult {
  passed: boolean;
  reason?: string;
  score: number; // 0-100, only meaningful when passed = true
}

const MIN_SIDEWALK_WIDTH_WHEELCHAIR = 1.2; // meters, per PUPR pedestrian facility guideline intent

/**
 * Hard Constraint layer (System Architecture section 8 / Product Guide
 * Layer 1). A route is REJECTED outright — not merely down-weighted — if it
 * violates the constraint for the user's mode. This must run before any
 * comfort scoring.
 */
export function applyAccessibilityFilter(route: CandidateRoute, mode: PersonalMode): AccessibilityResult {
  for (const segment of route.segments) {
    if (mode === 'WHEELCHAIR' || mode === 'STROLLER') {
      if (segment.hasStairs && !segment.hasRamp) {
        return { passed: false, reason: 'Terdapat tangga tanpa ramp alternatif', score: 0 };
      }
      if (segment.widthMeters !== null && segment.widthMeters < MIN_SIDEWALK_WIDTH_WHEELCHAIR) {
        return { passed: false, reason: 'Lebar trotoar tidak mencukupi', score: 0 };
      }
    }

    if (mode === 'LOW_VISION' && !segment.hasGuidingBlock) {
      // Soft-ish for low vision: missing guiding block lowers score heavily
      // rather than hard-rejecting, since alternative cues (audio, staff)
      // may exist in the field. Adjust to a hard reject if your pilot data
      // shows this is unsafe without guiding blocks.
    }

    // Any mode: permanent obstacle blocking the segment with no bypass fails.
    const blockingObstacle = segment.activeObstacles.find((o) =>
      ['STAIRS', 'CONSTRUCTION', 'FALLEN_TREE'].includes(o.type),
    );
    if (blockingObstacle && (mode === 'WHEELCHAIR' || mode === 'STROLLER')) {
      return { passed: false, reason: `Hambatan aktif: ${blockingObstacle.type}`, score: 0 };
    }
  }

  return { passed: true, score: computeAccessibilityScore(route, mode) };
}

function computeAccessibilityScore(route: CandidateRoute, mode: PersonalMode): number {
  if (route.segments.length === 0) return 0;
  let total = 0;
  for (const s of route.segments) {
    let segScore = 100;
    if (mode === 'WHEELCHAIR' || mode === 'STROLLER') {
      if (!s.hasRamp && s.hasStairs) segScore -= 100; // should already be filtered out
      if (s.surfaceCondition && ['cracked', 'unpaved', 'damaged'].includes(s.surfaceCondition)) segScore -= 20;
    }
    if (mode === 'LOW_VISION') {
      if (!s.hasGuidingBlock) segScore -= 30;
      if (!s.lightingAvailable) segScore -= 10;
    }
    if (mode === 'ELDERLY') {
      if (s.nearbyFacilities.every((f) => f.type !== 'BENCH')) segScore -= 10;
    }
    total += Math.max(0, segScore);
  }
  return Math.round(total / route.segments.length);
}
