import { CandidateRoute } from './types';

export interface LiveConditionResult {
  passed: boolean;
  reason?: string;

  activeObstacleCount: number;

  safetyPenalty: number;
}

/**
 * Severity tiap obstacle.
 * Semakin besar nilainya semakin berbahaya.
 */
const OBSTACLE_PENALTY: Record<string, number> = {
  FLOOD: 60,

  CONSTRUCTION: 45,

  FALLEN_TREE: 50,

  STAIRS: 35,

  POTHOLE: 20,

  PARKED_VEHICLE: 10,
};

/**
 * Jika total penalty melewati nilai ini,
 * rute dianggap tidak layak dipakai.
 */
const MAX_ALLOWED_PENALTY = 90;

export function applyLiveConditionFilter(
  route: CandidateRoute,
): LiveConditionResult {

  let penalty = 0;

  let obstacleCount = 0;

  const reasons: string[] = [];

  for (const segment of route.segments) {

    for (const obstacle of segment.activeObstacles) {

      obstacleCount++;

      const obstaclePenalty =
        OBSTACLE_PENALTY[obstacle.type] ?? 15;

      penalty += obstaclePenalty;

      reasons.push(obstacle.type);
    }
  }

  penalty = Math.min(100, penalty);

  if (penalty >= MAX_ALLOWED_PENALTY) {

    return {

      passed: false,

      reason: `Rute memiliki hambatan berat (${reasons.join(', ')})`,

      activeObstacleCount: obstacleCount,

      safetyPenalty: 100,

    };

  }

  return {

    passed: true,

    activeObstacleCount: obstacleCount,

    safetyPenalty: penalty,

  };

}