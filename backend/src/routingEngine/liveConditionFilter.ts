import { CandidateRoute } from './types';

export interface LiveConditionResult {
  passed: boolean;
  reason?: string;
  activeObstacleCount: number;
  safetyPenalty: number; // subtracted from base safety score
}

/**
 * Live Condition layer (System Architecture section 6 flow step
 * "Live Condition Filter" / Product Guide Layer 3). Obstacles are only
 * considered if `isActive = true` and not expired (`expiresAt` in future or
 * null). Non-blocking obstacles reduce safety score instead of rejecting
 * the route outright.
 */
const BLOCKING_TYPES = ['STAIRS', 'CONSTRUCTION', 'FALLEN_TREE'];
const DEGRADING_TYPES = ['POTHOLE', 'FLOOD', 'PARKED_VEHICLE'];

export function applyLiveConditionFilter(route: CandidateRoute): LiveConditionResult {
  let blockingCount = 0;
  let degradingCount = 0;

  for (const segment of route.segments) {
    for (const obstacle of segment.activeObstacles) {
      if (BLOCKING_TYPES.includes(obstacle.type)) blockingCount += 1;
      if (DEGRADING_TYPES.includes(obstacle.type)) degradingCount += 1;
    }
  }

  if (blockingCount > 0) {
    return {
      passed: false,
      reason: `${blockingCount} hambatan aktif memblokir jalur (belum kedaluwarsa)`,
      activeObstacleCount: blockingCount + degradingCount,
      safetyPenalty: 100,
    };
  }

  const safetyPenalty = Math.min(60, degradingCount * 15);
  return {
    passed: true,
    activeObstacleCount: degradingCount,
    safetyPenalty,
  };
}
