import type { CFProblem } from '../types';
import { problemKey } from './statCalculators';

const BIN_MIN = 800;
const BIN_MAX = 3500;
const BIN_STEP = 100;

/** [800, 900, ..., 3500] => 28 bins. */
export const BINS: number[] = (() => {
  const bins: number[] = [];
  for (let r = BIN_MIN; r <= BIN_MAX; r += BIN_STEP) bins.push(r);
  return bins;
})();

export const BIN_LABELS: string[] = BINS.map((b) => String(b));

/**
 * Counts problems per 100-point bin from 800 to 3500.
 * Problems without a rating are excluded. When solvedSet is provided, only
 * problems whose key is in the set are counted (deduped by key).
 */
export function binByRating(
  problems: CFProblem[],
  solvedSet?: Set<string>,
): number[] {
  const counts = new Array<number>(BINS.length).fill(0);
  const seen = new Set<string>();
  for (const p of problems) {
    if (typeof p.rating !== 'number') continue;
    const key = problemKey(p);
    if (solvedSet && !solvedSet.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    const rating = p.rating;
    if (rating < BIN_MIN || rating > BIN_MAX) continue;
    const idx = Math.floor((rating - BIN_MIN) / BIN_STEP);
    const clamped = Math.min(Math.max(idx, 0), BINS.length - 1);
    counts[clamped] += 1;
  }
  return counts;
}
