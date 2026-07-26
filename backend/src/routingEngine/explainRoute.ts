import { CandidateRoute, PersonalMode, ScoredRoute } from './types';
import { shadePercentOfRoute } from './comfortScoring';

/**
 * F007 - Route Explanation
 *
 * Menjelaskan alasan kenapa suatu rute direkomendasikan.
 * Alasan dibuat dari data asli route sehingga konsisten
 * dengan scoring Accessibility, Comfort, dan Safety.
 */
export function explainRoute(
  route: CandidateRoute,
  mode: PersonalMode,
  obstacleCount: number,
): string[] {

  const reasons: string[] = [];

  const totalSegments = Math.max(route.segments.length, 1);

  //--------------------------------------------------------
  // Ramp
  //--------------------------------------------------------

  const rampCount =
    route.segments.filter(s => s.hasRamp).length;

  const rampRatio = rampCount / totalSegments;

  if (
    (mode === 'WHEELCHAIR' || mode === 'STROLLER')
    && rampRatio === 1
  ) {

    reasons.push("Seluruh jalur memiliki ramp");

  } else if (rampRatio >= 0.6) {

    reasons.push("Sebagian besar jalur memiliki ramp");

  }

  //--------------------------------------------------------
  // Tangga
  //--------------------------------------------------------

  const blockedStairs =
    route.segments.some(s => s.hasStairs && !s.hasRamp);

  if (
    (mode === 'WHEELCHAIR' || mode === 'STROLLER')
    && !blockedStairs
  ) {

    reasons.push("Tidak memiliki tangga tanpa ramp");

  }

  //--------------------------------------------------------
  // Guiding Block
  //--------------------------------------------------------

  const guidingCount =
    route.segments.filter(s => s.hasGuidingBlock).length;

  const guidingRatio =
    guidingCount / totalSegments;

  if (
    mode === "LOW_VISION"
    && guidingRatio >= 0.8
  ) {

    reasons.push("Guiding block tersedia hampir di seluruh jalur");

  } else if (
    mode === "LOW_VISION"
    && guidingRatio >= 0.5
  ) {

    reasons.push("Sebagian besar jalur memiliki guiding block");

  }

  //--------------------------------------------------------
  // Shade
  //--------------------------------------------------------

  const shade = shadePercentOfRoute(route);

  if (shade >= 80) {

    reasons.push("Mayoritas jalur teduh");

  } else if (shade >= 50) {

    reasons.push(`${shade}% jalur teduh`);

  }

  //--------------------------------------------------------
  // Bangku
  //--------------------------------------------------------

  const benchCount =
    route.segments.filter(segment =>
      segment.nearbyFacilities.some(f =>
        f.type === "BENCH"
        || f.type === "SHELTER"
      )
    ).length;

  if (
    mode === "ELDERLY"
    && benchCount >= 3
  ) {

    reasons.push("Banyak titik istirahat tersedia");

  } else if (
    mode === "ELDERLY"
    && benchCount > 0
  ) {

    reasons.push(`${benchCount} titik istirahat tersedia`);

  }

  //--------------------------------------------------------
  // Lighting
  //--------------------------------------------------------

  const lightingRatio =
    route.segments.filter(
      s => s.lightingAvailable
    ).length / totalSegments;

  if (lightingRatio >= 0.8) {

    reasons.push("Pencahayaan jalan sangat baik");

  }

  //--------------------------------------------------------
  // Hambatan
  //--------------------------------------------------------

  if (obstacleCount === 0) {

    reasons.push("Tidak ditemukan hambatan aktif");

  } else if (obstacleCount <= 2) {

    reasons.push("Hambatan ringan masih dapat dilalui");

  } else {

    reasons.push("Beberapa hambatan ditemukan di sepanjang jalur");

  }

  //--------------------------------------------------------
  // Surface
  //--------------------------------------------------------

  const damagedSurface =
    route.segments.filter(s =>
      ["cracked", "damaged", "unpaved"]
        .includes(s.surfaceCondition ?? "")
    ).length;

  if (damagedSurface === 0) {

    reasons.push("Permukaan trotoar relatif baik");

  }

  return reasons;
}

/**
 * Badge yang muncul pada hasil pencarian rute.
 */
export function buildLabels(
  routes: ScoredRoute[],
) {

  const labels =
    new Map<string, string[]>();

  routes.forEach(route => {

    labels.set(route.id, []);

  });

  if (routes.length === 0)
    return labels;

  //----------------------------------------------------
  // Accessibility
  //----------------------------------------------------

  const accessible =
    [...routes].sort(
      (a, b) =>
        b.accessibility - a.accessibility
    )[0];

  labels.get(accessible.id)
    ?.push("Paling Aksesibel");

  //----------------------------------------------------
  // Comfort
  //----------------------------------------------------

  const comfortable =
    [...routes].sort(
      (a, b) =>
        b.comfort - a.comfort
    )[0];

  labels.get(comfortable.id)
    ?.push("Paling Nyaman");

  //----------------------------------------------------
  // Safety
  //----------------------------------------------------

  const safest =
    [...routes].sort(
      (a, b) =>
        b.safety - a.safety
    )[0];

  labels.get(safest.id)
    ?.push("Paling Aman");

  //----------------------------------------------------
  // Distance
  //----------------------------------------------------

  const shortest =
    [...routes].sort(
      (a, b) =>
        a.distanceMeters - b.distanceMeters
    )[0];

  labels.get(shortest.id)
    ?.push("Paling Pendek");

  //----------------------------------------------------
  // Overall
  //----------------------------------------------------

  const best =
    [...routes].sort(
      (a, b) =>
        b.finalScore - a.finalScore
    )[0];

  labels.get(best.id)
    ?.push("Direkomendasikan");

  return labels;
}