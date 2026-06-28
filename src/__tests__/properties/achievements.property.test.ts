// Feature: codeforces-insights, Property 22: badge unlocked state equals condition(stats)
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { BADGE_DEFINITIONS } from '../../constants/badges';
import type { ComputedStats } from '../../types';

const statsArb: fc.Arbitrary<ComputedStats> = fc.record({
  totalAC: fc.integer({ min: 0, max: 2000 }),
  uniqueSolved: fc.integer({ min: 0, max: 2000 }),
  avgDifficulty: fc.option(fc.integer({ min: 800, max: 3500 }), { nil: null }),
  highestDifficulty: fc.option(fc.integer({ min: 800, max: 3500 }), { nil: null }),
  totalContests: fc.integer({ min: 0, max: 200 }),
  currentRating: fc.option(fc.integer({ min: 0, max: 3500 }), { nil: null }),
  maxRating: fc.option(fc.integer({ min: 0, max: 4000 }), { nil: null }),
  bestRank: fc.option(fc.integer({ min: 1, max: 50000 }), { nil: null }),
  worstRank: fc.option(fc.integer({ min: 1, max: 50000 }), { nil: null }),
  avgRank: fc.option(fc.integer({ min: 1, max: 50000 }), { nil: null }),
  highestGain: fc.option(fc.integer({ min: 0, max: 500 }), { nil: null }),
  biggestLoss: fc.option(fc.integer({ min: 0, max: 500 }), { nil: null }),
  consistencyScore: fc.option(fc.float({ min: -5, max: 1 }), { nil: null }),
  topLanguage: fc.option(fc.constantFrom('C++', 'Python'), { nil: null }),
  weakTags: fc.array(fc.string(), { maxLength: 5 }),
  strongTags: fc.array(fc.string(), { maxLength: 10 }),
  ratingTrend: fc.constantFrom('up', 'down', 'flat', null),
  submissionFreq: fc.float({ min: 0, max: 50 }),
  mostActiveDow: fc.option(fc.constantFrom('Mon', 'Tue'), { nil: null }),
  rank: fc.option(fc.constantFrom('newbie', 'expert'), { nil: null }),
}) as fc.Arbitrary<ComputedStats>;

describe('BADGE_DEFINITIONS', () => {
  it('Property 22: unlocked equals condition(stats) for every badge', () => {
    fc.assert(
      fc.property(statsArb, (stats) => {
        for (const badge of BADGE_DEFINITIONS) {
          const unlocked = badge.condition(stats);
          expect(typeof unlocked).toBe('boolean');
          // The component renders `unlocked` exactly as condition(stats).
          expect(badge.condition(stats)).toBe(unlocked);
        }
      }),
      { numRuns: 100 },
    );
  });
});
