import { randomUUID } from 'crypto';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middlewares/errorHandler';
import { recommendRoutes } from '../../routingEngine';
import { PersonalMode, PreferenceWeights } from '../../routingEngine/types';
import { SearchRouteInput } from './routes.schema';
import { getSearchResult, saveSearchResult } from './routeSearchCache';

const DEFAULT_WEIGHTS: PreferenceWeights = {
  shadeWeight: 0.3,
  seatingWeight: 0.2,
  lightingWeight: 0.2,
  distanceWeight: 0.3,
};

// F004: search route. Uses logged-in user's saved preference (F002) when
// available, otherwise falls back to query param mode + default weights.
export async function searchRoutes(input: SearchRouteInput, userId?: string) {
  let mode: PersonalMode = input.mode ?? 'GENERAL';
  let weights: PreferenceWeights = DEFAULT_WEIGHTS;

  if (userId) {
    const prefs = await prisma.userPreference.findUnique({ where: { userId } });
    if (prefs) {
      mode = input.mode ?? (prefs.mode as PersonalMode);
      weights = {
        shadeWeight: prefs.shadeWeight,
        seatingWeight: prefs.seatingWeight,
        lightingWeight: prefs.lightingWeight,
        distanceWeight: prefs.distanceWeight,
      };
    }
  }

  const { routes, eliminated } = await recommendRoutes({
    originLat: input.originLat,
    originLng: input.originLng,
    destLat: input.destLat,
    destLng: input.destLng,
    mode,
    weights,
  });

  // F004 acceptance: tidak boleh kosong -> if zero routes survive, this is
  // a legitimate empty state the controller should render distinctly from
  // an error (e.g. every candidate hit a hard constraint).
  const searchId = randomUUID();
  saveSearchResult(searchId, routes, eliminated);

  if (userId && routes.length > 0) {
    await prisma.routeHistory.create({
      data: {
        userId,
        originLat: input.originLat,
        originLng: input.originLng,
        destLat: input.destLat,
        destLng: input.destLng,
        mode,
      },
    });
  }

  return { searchId, mode, routes, eliminated };
}

// F006: route detail — full step data for one specific route from a
// previous search.
export async function getRouteDetail(searchId: string, routeId: string) {
  const cached = getSearchResult(searchId);
  if (!cached) {
    throw new ApiError(404, 'Hasil pencarian rute sudah kedaluwarsa. Silakan cari ulang.');
  }
  const route = cached.routes.find((r) => r.id === routeId);
  if (!route) {
    throw new ApiError(404, 'Rute tidak ditemukan pada hasil pencarian ini.');
  }
  return route;
}
