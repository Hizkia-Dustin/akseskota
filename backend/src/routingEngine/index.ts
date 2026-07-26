import { generateCandidateRoutes } from './generateCandidates';
import { applyAccessibilityFilter } from './accessibilityFilter';
import { computeComfortScore } from './comfortScoring';
import { applyLiveConditionFilter } from './liveConditionFilter';
import { buildLabels, explainRoute } from './explainRoute';
import {
  PersonalMode,
  PreferenceWeights,
  ScoredRoute,
  CandidateRoute,
} from './types';

export interface RecommendRoutesInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  mode: PersonalMode;
  weights: PreferenceWeights;
}

const DEFAULT_WALK_SPEED_M_PER_MIN = 60;

/**
 * Distance Score
 *
 * Route terpendek = 100
 * Route terpanjang = 0
 */
function calculateDistanceScore(
  distance: number,
  shortest: number,
  longest: number,
): number {
  if (shortest === longest) return 100;

  return Math.round(
    ((longest - distance) / (longest - shortest)) * 100,
  );
}

/**
 * Final Recommendation Score
 *
 * Accessibility tetap prioritas utama.
 */
function calculateFinalScore(
  accessibility: number,
  comfort: number,
  safety: number,
  distanceScore: number,
): number {
  return Math.round(
    accessibility * 0.4 +
      comfort * 0.3 +
      safety * 0.2 +
      distanceScore * 0.1,
  );
}

export async function recommendRoutes(
  input: RecommendRoutesInput,
): Promise<{
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

  const survivors: (ScoredRoute & {
    candidate: CandidateRoute;
  })[] = [];

  for (const candidate of candidates) {
    const accessResult = applyAccessibilityFilter(
      candidate,
      input.mode,
    );

    if (!accessResult.passed) {
      eliminated.push({
        id: candidate.id,
        reason:
          accessResult.reason ??
          'Tidak memenuhi accessibility constraint',
      });

      continue;
    }

    const liveResult = applyLiveConditionFilter(candidate);

    if (!liveResult.passed) {
      eliminated.push({
        id: candidate.id,
        reason:
          liveResult.reason ??
          'Diblokir kondisi aktual jalur',
      });

      continue;
    }

    const comfort = computeComfortScore(
      candidate,
      input.weights,
    );

    const safety = Math.max(
      0,
      100 - liveResult.safetyPenalty,
    );

    const durationMinutes = Math.max(
      1,
      Math.round(
        candidate.distanceMeters /
          DEFAULT_WALK_SPEED_M_PER_MIN,
      ),
    );

    survivors.push({
      candidate,

      id: candidate.id,

      distanceMeters: Math.round(
        candidate.distanceMeters,
      ),

      durationMinutes,

      accessibility: accessResult.score,

      comfort,

      safety,

      finalScore: 0,

      reasons: explainRoute(
        candidate,
        input.mode,
        liveResult.activeObstacleCount,
      ),

      labels: [],
    });
  }

  if (survivors.length === 0) {
    return {
      routes: [],
      eliminated,
    };
  }

  //---------------------------------------
  // Distance Score
  //---------------------------------------

  const shortest = Math.min(
    ...survivors.map((r) => r.distanceMeters),
  );

  const longest = Math.max(
    ...survivors.map((r) => r.distanceMeters),
  );

  //---------------------------------------
  // Final Score
  //---------------------------------------

  survivors.forEach((route) => {
    const distanceScore = calculateDistanceScore(
      route.distanceMeters,
      shortest,
      longest,
    );

    route.finalScore = calculateFinalScore(
      route.accessibility,
      route.comfort,
      route.safety,
      distanceScore,
    );
  });

  //---------------------------------------
  // Ranking
  //---------------------------------------

  survivors.sort(
    (a, b) => b.finalScore - a.finalScore,
  );

  //---------------------------------------
  // Labels
  //---------------------------------------

  const labels = buildLabels(survivors);

  survivors.forEach((r) => {
    r.labels = labels.get(r.id) ?? [];
  });

  return {
    routes: survivors.map(({ candidate, ...route }) => route),
    eliminated,
  };
}