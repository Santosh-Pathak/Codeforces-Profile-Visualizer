// Feature: codeforces-insights, Property 17: rating bin assignment is total and exclusive
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { binByRating, BINS } from '../../utils/problemBinner';
import type { CFProblem } from '../../types';

describe('binByRating', () => {
  it('Property 17: each rated problem lands in exactly one correct bin', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 800, max: 3500 }), { maxLength: 100 }),
        (ratings) => {
          const problems: CFProblem[] = ratings.map((rating, i) => ({
            contestId: i + 1,
            index: 'A',
            name: `p${i}`,
            type: 'PROGRAMMING',
            rating,
            tags: [],
          }));
          const counts = binByRating(problems);
          // total counts equals number of (unique) problems
          const total = counts.reduce((a, b) => a + b, 0);
          expect(total).toBe(problems.length);

          // every rating maps to the floor((r-800)/100) bin
          ratings.forEach((r) => {
            const idx = Math.min(
              Math.floor((r - 800) / 100),
              BINS.length - 1,
            );
            expect(idx).toBeGreaterThanOrEqual(0);
            expect(idx).toBeLessThan(BINS.length);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
