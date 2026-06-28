// Feature: codeforces-insights, Property 2: normalized response shape
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { AxiosError, type AxiosResponse } from 'axios';
import { normalize, normalizeError } from '../../services/apiClient';

describe('normalize / normalizeError', () => {
  it('Property 2: always returns { data, error, status } with correct types', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 200, max: 599 }),
        fc.boolean(),
        (status, ok) => {
          const response = {
            status,
            data: ok ? { status: 'OK', result: [1, 2, 3] } : { status: 'FAILED', comment: 'bad' },
            statusText: '',
            headers: {},
            config: {},
          } as AxiosResponse;
          const out = normalize(response);
          expect(typeof out.status).toBe('number');
          expect(out.error === null || typeof out.error === 'string').toBe(true);
          if (ok) expect(out.data).not.toBeNull();
          else expect(out.data).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('Property 2: error normalization yields the same shape', () => {
    fc.assert(
      fc.property(fc.constantFrom(400, 429, 500, 503, 0), (status) => {
        const err = new AxiosError('boom');
        if (status !== 0) {
          err.response = {
            status,
            data: {},
            statusText: '',
            headers: { 'retry-after': '12' },
            config: {} as AxiosError['config'],
          } as AxiosResponse;
        }
        const out = normalizeError(err);
        expect(out.data).toBeNull();
        expect(typeof out.status).toBe('number');
        expect(typeof out.error).toBe('string');
      }),
      { numRuns: 100 },
    );
  });
});
