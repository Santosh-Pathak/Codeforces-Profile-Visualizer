// Feature: codeforces-insights, Property 11: Delta formatting is total and correct
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { formatDelta } from '../../utils/formatters';

const MINUS = '\u2212';

describe('formatDelta', () => {
  it('Property 11: prefixes sign correctly with absolute value', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        const out = formatDelta(n);
        if (n > 0) {
          expect(out).toBe(`+${n}`);
        } else {
          expect(out).toBe(`${MINUS}${Math.abs(n)}`);
        }
      }),
      { numRuns: 100 },
    );
  });
});
