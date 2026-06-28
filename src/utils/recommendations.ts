import type { CFProblem } from '../types';
import { problemKey } from './statCalculators';

/**
 * Recommends unsolved problems within ±200 of currentRating, prioritising
 * those whose tags overlap the user's weak tags. Returns up to `limit`.
 */
export function getRecommendations(
  problems: CFProblem[] | null,
  solvedSet: Set<string>,
  currentRating: number | null | undefined,
  weakTags: string[],
  limit = 20,
): CFProblem[] {
  if (!problems || currentRating == null) return [];
  const lo = currentRating - 200;
  const hi = currentRating + 200;
  const weakSet = new Set(weakTags);

  const candidates = problems.filter((p) => {
    if (typeof p.rating !== 'number') return false;
    if (p.rating < lo || p.rating > hi) return false;
    return !solvedSet.has(problemKey(p));
  });

  const scored = candidates.map((p) => {
    const overlap = (p.tags ?? []).reduce(
      (acc, tag) => acc + (weakSet.has(tag) ? 1 : 0),
      0,
    );
    return { problem: p, overlap };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    return (b.problem.rating ?? 0) - (a.problem.rating ?? 0);
  });

  return scored.slice(0, limit).map((s) => s.problem);
}
