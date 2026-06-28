// Feature: codeforces-insights, Properties 9 & 10: handle extraction and validation
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { extractHandle, validateHandle } from '../../utils/validators';

const handleArb = fc
  .stringMatching(/^[a-zA-Z0-9_-]{1,24}$/)
  .filter((s) => s.length >= 1 && s.length <= 24);

describe('extractHandle', () => {
  it('Property 9: extracts handle from a profile URL', () => {
    fc.assert(
      fc.property(handleArb, (handle) => {
        const url = `https://codeforces.com/profile/${handle}`;
        expect(extractHandle(url)).toBe(handle);
        expect(extractHandle(`codeforces.com/profile/${handle}/`)).toBe(handle);
      }),
      { numRuns: 100 },
    );
  });
});

describe('validateHandle', () => {
  it('Property 10: rejects strings with invalid characters', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 30 })
          .filter((s) => /[^a-zA-Z0-9_-]/.test(s.trim()) && s.trim().length > 0),
        (s) => {
          expect(validateHandle(s).valid).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
