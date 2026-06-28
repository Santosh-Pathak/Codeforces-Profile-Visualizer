// Feature: codeforces-insights, Property 21: recommendations exclude solved + respect rating window
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getRecommendations } from '../../utils/recommendations';
import { problemKey } from '../../utils/statCalculators';
import { problemArb } from './arbitraries';

describe('getRecommendations', () => {
  it('Property 21: never returns solved problems and stays within ±200', () => {
    fc.assert(
      fc.property(
        fc.array(problemArb, { maxLength: 200 }),
        fc.integer({ min: 800, max: 3500 }),
        (problems, currentRating) => {
          // Mark a random subset as solved.
          const solved = new Set<string>();
          problems.forEach((p, i) => {
            if (i % 3 === 0) solved.add(problemKey(p));
          });
          const recs = getRecommendations(problems, solved, currentRating, ['dp']);
          for (const r of recs) {
            expect(solved.has(problemKey(r))).toBe(false);
            expect(r.rating).toBeDefined();
            expect(r.rating!).toBeGreaterThanOrEqual(currentRating - 200);
            expect(r.rating!).toBeLessThanOrEqual(currentRating + 200);
          }
          expect(recs.length).toBeLessThanOrEqual(20);
        },
      ),
      { numRuns: 100 },
    );
  });
});
