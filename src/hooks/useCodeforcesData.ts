import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getUserInfo,
  getUserRating,
  getUserStatus,
  getProblemset,
  getContestList,
} from '../services';
import { readCache, writeCache, clearCache } from '../utils/cache';
import type {
  UseCodeforcesDataResult,
  CFUserInfo,
  CFRatingChange,
  CFSubmission,
  CFProblem,
} from '../types';

const ENDPOINT_LABELS = [
  'user.info',
  'user.rating',
  'user.status',
  'problemset.problems',
  'contest.list',
];

export function useCodeforcesData(handle: string): UseCodeforcesDataResult {
  const [profile, setProfile] = useState<CFUserInfo | null>(null);
  const [contests, setContests] = useState<CFRatingChange[] | null>(null);
  const [submissions, setSubmissions] = useState<CFSubmission[] | null>(null);
  const [problems, setProblems] = useState<CFProblem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!handle) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    // Cache hit?
    const cached = readCache(handle);
    if (cached) {
      setProfile(cached.profile);
      setContests(cached.contests);
      setSubmissions(cached.submissions);
      setProblems(cached.problems);
      setLoading(false);
      setError(null);
      setStatus(200);
      setRetryAfter(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setStatus(null);
    setRetryAfter(null);

    (async () => {
      const results = await Promise.allSettled([
        getUserInfo(handle, signal),
        getUserRating(handle, signal),
        getUserStatus(handle, signal),
        getProblemset(signal),
        getContestList(signal),
      ]);

      if (cancelled || signal.aborted) return;

      const [infoR, ratingR, statusR, problemsR] = results;

      const nextProfile =
        infoR.status === 'fulfilled' ? infoR.value.data : null;
      const nextContests =
        ratingR.status === 'fulfilled' ? ratingR.value.data : null;
      const nextSubmissions =
        statusR.status === 'fulfilled' ? statusR.value.data : null;
      const nextProblems =
        problemsR.status === 'fulfilled'
          ? (problemsR.value.data?.problems ?? null)
          : null;

      // Collect failed endpoints + surface 400/429 specially.
      const failed: string[] = [];
      let firstStatus: number | null = null;
      let rateLimitAfter: number | null = null;

      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          const resp = r.value;
          if (resp.error || resp.data == null) {
            failed.push(ENDPOINT_LABELS[idx]);
            if (firstStatus == null) firstStatus = resp.status;
            if (resp.status === 429 && resp.retryAfter != null) {
              rateLimitAfter = resp.retryAfter;
            }
          }
        } else {
          failed.push(ENDPOINT_LABELS[idx]);
        }
      });

      setProfile(nextProfile);
      setContests(nextContests);
      setSubmissions(nextSubmissions);
      setProblems(nextProblems);

      const allFailed =
        !nextProfile && !nextContests && !nextSubmissions && !nextProblems;

      // Determine top-level status: prefer the user.info status for 400/429.
      const infoStatus =
        infoR.status === 'fulfilled' ? infoR.value.status : 0;
      const infoRetry =
        infoR.status === 'fulfilled' ? infoR.value.retryAfter : undefined;

      if (infoStatus === 400) {
        setStatus(400);
        setError('User not found. Check the handle.');
        setRetryAfter(null);
      } else if (infoStatus === 429 || rateLimitAfter != null) {
        setStatus(429);
        setError('Rate limited. Please wait before retrying.');
        setRetryAfter(infoRetry ?? rateLimitAfter ?? 30);
      } else if (allFailed) {
        setStatus(firstStatus ?? 0);
        setError('Network error. Could not load any data.');
        setRetryAfter(null);
      } else if (failed.length > 0) {
        setStatus(200);
        setError(`Failed to load: ${failed.join(', ')}`);
        setRetryAfter(null);
      } else {
        setStatus(200);
        setError(null);
        setRetryAfter(null);
        // Only cache a fully-successful, non-rate-limited fetch.
        writeCache(handle, {
          profile: nextProfile,
          contests: nextContests,
          submissions: nextSubmissions,
          problems: nextProblems,
        });
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [handle, reloadToken]);

  const refetch = useCallback(() => {
    clearCache(handle);
    setReloadToken((t) => t + 1);
  }, [handle]);

  return {
    profile,
    contests,
    submissions,
    problems,
    loading,
    error,
    status,
    retryAfter,
    refetch,
  };
}

export default useCodeforcesData;
