import { ScoredRoute } from '../../routingEngine/types';

interface CachedSearch {
  searchId: string;
  routes: ScoredRoute[];
  eliminated: { id: string; reason: string }[];
  createdAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes — enough for a user to browse comparison -> detail
const cache = new Map<string, CachedSearch>();

export function saveSearchResult(searchId: string, routes: ScoredRoute[], eliminated: { id: string; reason: string }[]) {
  cache.set(searchId, { searchId, routes, eliminated, createdAt: Date.now() });
  cleanupExpired();
}

export function getSearchResult(searchId: string): CachedSearch | undefined {
  const entry = cache.get(searchId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    cache.delete(searchId);
    return undefined;
  }
  return entry;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.createdAt > CACHE_TTL_MS) cache.delete(key);
  }
}

// NOTE: this is an in-process cache — fine for a single-instance MVP.
// If the backend scales horizontally, swap this for Redis with the same
// save/get interface.
