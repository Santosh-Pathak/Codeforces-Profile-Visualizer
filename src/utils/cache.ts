import type { CacheEntry, CodeforcesData } from '../types';

export const CACHE_TTL = 900_000; // 15 minutes

export function cacheKey(handle: string): string {
  return `cf_insights_${handle.toLowerCase()}`;
}

export function readCache(handle: string): CodeforcesData | null {
  try {
    const raw = localStorage.getItem(cacheKey(handle));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp > entry.ttl) {
      localStorage.removeItem(cacheKey(handle));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function writeCache(handle: string, data: CodeforcesData): void {
  try {
    const entry: CacheEntry = { timestamp: Date.now(), ttl: CACHE_TTL, data };
    localStorage.setItem(cacheKey(handle), JSON.stringify(entry));
  } catch {
    // Quota exceeded or serialization failure — silently skip caching.
  }
}

export function clearCache(handle: string): void {
  try {
    localStorage.removeItem(cacheKey(handle));
  } catch {
    // ignore
  }
}
