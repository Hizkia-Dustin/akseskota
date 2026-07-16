export type PersonalMode = 'WHEELCHAIR' | 'ELDERLY' | 'STROLLER' | 'LOW_VISION' | 'GENERAL';

export interface PreferenceWeights {
  shadeWeight: number;
  seatingWeight: number;
  lightingWeight: number;
  distanceWeight: number;
}

export interface SegmentData {
  id: string;
  surfaceCondition: string | null;
  widthMeters: number | null;
  hasRamp: boolean;
  hasStairs: boolean;
  hasGuidingBlock: boolean;
  shadeLevel: number | null;
  lightingAvailable: boolean;
  distanceM: number;
  geojson: unknown;
  activeObstacles: { id: string; type: string }[];
  nearbyFacilities: { id: string; type: string; condition: string | null }[];
}

export interface CandidateRoute {
  id: string;
  segments: SegmentData[];
  distanceMeters: number;
}

export interface ScoredRoute {
  id: string;
  distanceMeters: number;
  durationMinutes: number;
  accessibility: number; // 0-100
  comfort: number; // 0-100
  safety: number; // 0-100
  reasons: string[];
  labels: string[];
  eliminated?: { reason: string };
}
