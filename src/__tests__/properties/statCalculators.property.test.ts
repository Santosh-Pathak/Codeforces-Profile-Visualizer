// Feature: codeforces-insights, Properties 13-20: stat calculators
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  computeSubmissionStats,
  computeUniqueSolved,
  computeTagCounts,
  computeConsistencyScore,
  computeHeatmapData,
  computeComputedStats,
} from '../../utils/statCalculators';
import { sortContests } from '../../utils/sortContests';
import { generateInsights } from '../../utils/insightGenerator';
import { submissionArb, ratingChangeArb } from './arbitraries';

describe('computeSubmissionStats', () => {
  it('Property 15: verdict counts sum to total submissions', () => {
    fc.assert(
      fc.property(fc.array(submissionArb, { maxLength: 200 }), (subs) => {
        const stats = computeSubmissionStats(subs);
        const sum = Object.values(stats.verdictCounts).reduce((a, b) => a + b, 0);
        expect(sum).toBe(subs.length);
      }),
      { numRuns: 100 },
    );
  });
});

describe('computeUniqueSolved', () => {
  it('Property 16: unique solved count <= total AC count', () => {
    fc.assert(
      fc.property(fc.array(submissionArb, { maxLength: 200 }), (subs) => {
        const unique = computeUniqueSolved(subs).size;
        const acCount = subs.filter((s) => s.verdict === 'OK').length;
        expect(unique).toBeLessThanOrEqual(acCount);
      }),
      { numRuns: 100 },
    );
  });
});

describe('computeTagCounts', () => {
  it('Property 18: each tag count <= unique solved problem count', () => {
    fc.assert(
      fc.property(fc.array(submissionArb, { maxLength: 200 }), (subs) => {
        const tagCounts = computeTagCounts(subs);
        const uniqueSolved = computeUniqueSolved(subs).size;
        for (const count of tagCounts.values()) {
          expect(count).toBeLessThanOrEqual(uniqueSolved);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('computeHeatmapData', () => {
  it('Property 19: only AC submissions, yyyy-MM-dd dates', () => {
    fc.assert(
      fc.property(fc.array(submissionArb, { maxLength: 200 }), (subs) => {
        const data = computeHeatmapData(subs);
        const acCount = subs.filter((s) => s.verdict === 'OK').length;
        const total = data.reduce((a, d) => a + d.count, 0);
        expect(total).toBe(acCount);
        for (const d of data) {
          expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('computeConsistencyScore', () => {
  it('Property 14: equals 1 - stddev/mean(abs), 2dp, null on zero', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -500, max: 500 }), { minLength: 1, maxLength: 50 }),
        (changes) => {
          const absMean =
            changes.reduce((a, b) => a + Math.abs(b), 0) / changes.length;
          const score = computeConsistencyScore(changes);
          if (absMean === 0) {
            expect(score).toBeNull();
          } else {
            const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
            const variance =
              changes.reduce((a, b) => a + (b - mean) ** 2, 0) / changes.length;
            const expected =
              Math.round((1 - Math.sqrt(variance) / absMean) * 100) / 100;
            expect(score).toBeCloseTo(expected, 5);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('sortContests', () => {
  it('Property 13: result is ordered for the chosen column/direction', () => {
    fc.assert(
      fc.property(
        fc.array(ratingChangeArb, { maxLength: 50 }),
        fc.constantFrom('rank', 'oldRating', 'newRating', 'delta', 'date'),
        fc.constantFrom('asc', 'desc'),
        (contests, col, dir) => {
          const sorted = sortContests(
            contests,
            col as 'rank',
            dir as 'asc',
          );
          const valueOf = (c: (typeof sorted)[number]) => {
            switch (col) {
              case 'rank':
                return c.rank;
              case 'oldRating':
                return c.oldRating;
              case 'newRating':
                return c.newRating;
              case 'delta':
                return c.newRating - c.oldRating;
              default:
                return c.ratingUpdateTimeSeconds;
            }
          };
          for (let i = 1; i < sorted.length; i++) {
            const prev = valueOf(sorted[i - 1]);
            const cur = valueOf(sorted[i]);
            if (dir === 'asc') expect(prev).toBeLessThanOrEqual(cur);
            else expect(prev).toBeGreaterThanOrEqual(cur);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('generateInsights', () => {
  it('Property 20: returns at least 10 insights for any stats', () => {
    fc.assert(
      fc.property(
        fc.array(submissionArb, { maxLength: 100 }),
        fc.array(ratingChangeArb, { maxLength: 50 }),
        (subs, contests) => {
          const stats = computeComputedStats(null, contests, subs, null);
          expect(generateInsights(stats).length).toBeGreaterThanOrEqual(10);
        },
      ),
      { numRuns: 100 },
    );
  });
});
