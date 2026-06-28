// Feature: codeforces-insights, Properties 5 & 8: cache key format and round-trip fidelity
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { readCache, writeCache, cacheKey } from '../../utils/cache';
import { submissionArb, ratingChangeArb } from './arbitraries';
import type { CodeforcesData } from '../../types';

beforeEach(() => {
  localStorage.clear();
});

const dataArb: fc.Arbitrary<CodeforcesData> = fc.record({
  profile: fc.constant(null),
  contests: fc.array(ratingChangeArb, { maxLength: 20 }),
  submissions: fc.array(submissionArb, { maxLength: 20 }),
  problems: fc.constant(null),
});

const handleArb = fc.stringMatching(/^[a-zA-Z0-9_-]{1,24}$/);

describe('cache', () => {
  it('Property 5: cache key equals cf_insights_<lowercase handle>', () => {
    fc.assert(
      fc.property(handleArb, (handle) => {
        expect(cacheKey(handle)).toBe(`cf_insights_${handle.toLowerCase()}`);
      }),
      { numRuns: 100 },
    );
  });

  it('Property 8: write then read produces a deeply-equal object', () => {
    fc.assert(
      fc.property(handleArb, dataArb, (handle, data) => {
        localStorage.clear();
        writeCache(handle, data);
        const restored = readCache(handle);
        expect(restored).toEqual(data);
      }),
      { numRuns: 100 },
    );
  });
});
