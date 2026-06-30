import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserInfo, getUserRating, getUserStatus, getProblemset } from '../services';
import { readCache, writeCache, clearCache } from '../utils/cache';
import type {
  UseCodeforcesDataResult,
  CFUserInfo,
  CFRatingChange,
  CFSubmission,
  CFProblem,
} from '../types';

const ENDPOINT_LABELS = ['user.info', 'user.rating', 'user.status', 'problemset.problems'];

/** Recent submissions cover most current-year dashboards quickly. */
const INITIAL_SUBMISSION_COUNT = 500;
const FULL_SUBMISSION_COUNT = 10_000;

interface DataState {
  profile: CFUserInfo | null;
  contests: CFRatingChange[] | null;
  submissions: CFSubmission[] | null;
  problems: CFProblem[] | null;
  submissionsComplete: boolean;
  problemsLoaded: boolean;
}

export function useCodeforcesData(handle: string): UseCodeforcesDataResult {
  const [profile, setProfile] = useState<CFUserInfo | null>(null);
  const [contests, setContests] = useState<CFRatingChange[] | null>(null);
  const [submissions, setSubmissions] = useState<CFSubmission[] | null>(null);
  const [problems, setProblems] = useState<CFProblem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submissionsComplete, setSubmissionsComplete] = useState(false);
  const [problemsLoaded, setProblemsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const stateRef = useRef<DataState>({
    profile: null,
    contests: null,
    submissions: null,
    problems: null,
    submissionsComplete: false,
    problemsLoaded: false,
  });
  const fullFetchRef = useRef<Promise<void> | null>(null);
  const handleRef = useRef(handle);

  useEffect(() => {
    handleRef.current = handle;
    stateRef.current = {
      profile,
      contests,
      submissions,
      problems,
      submissionsComplete,
      problemsLoaded,
    };
  }, [
    handle,
    profile,
    contests,
    submissions,
    problems,
    submissionsComplete,
    problemsLoaded,
  ]);

  const persistCache = useCallback((state: DataState) => {
    if (!handleRef.current) return;
    writeCache(handleRef.current, {
      profile: state.profile,
      contests: state.contests,
      submissions: state.submissions,
      problems: state.problems,
      submissionsComplete: state.submissionsComplete,
      problemsLoaded: state.problemsLoaded,
    });
  }, []);

  const runFullHistoryFetch = useCallback(async () => {
    const h = handleRef.current;
    if (!h) return;

    const start = stateRef.current;
    if (start.submissionsComplete && start.problemsLoaded) return;
    if (fullFetchRef.current) return fullFetchRef.current;

    fullFetchRef.current = (async () => {
      setLoadingMore(true);
      try {
        const needSubs = !stateRef.current.submissionsComplete;
        const needProblems = !stateRef.current.problemsLoaded;

        const [statusR, problemsR] = await Promise.allSettled([
          needSubs ? getUserStatus(h, undefined, FULL_SUBMISSION_COUNT) : null,
          needProblems ? getProblemset() : null,
        ]);

        const failed: string[] = [];
        let nextState = { ...stateRef.current };

        if (needSubs) {
          if (statusR.status === 'fulfilled' && statusR.value?.data && !statusR.value.error) {
            nextState = {
              ...nextState,
              submissions: statusR.value.data,
              submissionsComplete: true,
            };
            setSubmissions(statusR.value.data);
            setSubmissionsComplete(true);
          } else {
            failed.push('user.status');
          }
        }

        if (needProblems) {
          if (
            problemsR.status === 'fulfilled' &&
            problemsR.value?.data?.problems &&
            !problemsR.value.error
          ) {
            nextState = {
              ...nextState,
              problems: problemsR.value.data.problems,
              problemsLoaded: true,
            };
            setProblems(problemsR.value.data.problems);
            setProblemsLoaded(true);
          } else {
            failed.push('problemset.problems');
          }
        }

        if (failed.length > 0) {
          setError((prev) =>
            prev ?? `Failed to load full history: ${failed.join(', ')}`,
          );
        }

        persistCache(nextState);
      } finally {
        setLoadingMore(false);
        fullFetchRef.current = null;
      }
    })();

    return fullFetchRef.current;
  }, [persistCache]);

  const ensureFullHistory = useCallback(() => runFullHistoryFetch(), [runFullHistoryFetch]);

  useEffect(() => {
    if (!handle) return;

    fullFetchRef.current = null;

    const cached = readCache(handle);
    if (cached) {
      const cachedState: DataState = {
        profile: cached.profile,
        contests: cached.contests,
        submissions: cached.submissions,
        problems: cached.problems,
        submissionsComplete: cached.submissionsComplete ?? true,
        problemsLoaded: cached.problemsLoaded ?? cached.problems != null,
      };
      setProfile(cachedState.profile);
      setContests(cachedState.contests);
      setSubmissions(cachedState.submissions);
      setProblems(cachedState.problems);
      setSubmissionsComplete(cachedState.submissionsComplete);
      setProblemsLoaded(cachedState.problemsLoaded);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setStatus(200);
      setRetryAfter(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setStatus(null);
    setRetryAfter(null);
    setSubmissionsComplete(false);
    setProblemsLoaded(false);
    setProblems(null);

    (async () => {
      const results = await Promise.allSettled([
        getUserInfo(handle),
        getUserRating(handle),
        getUserStatus(handle, undefined, INITIAL_SUBMISSION_COUNT),
      ]);

      if (cancelled) return;

      const [infoR, ratingR, statusR] = results;

      const nextProfile =
        infoR.status === 'fulfilled' ? infoR.value.data : null;
      const nextContests =
        ratingR.status === 'fulfilled' ? ratingR.value.data : null;
      const nextSubmissions =
        statusR.status === 'fulfilled' ? statusR.value.data : null;

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

      const hasCoreData = !!(nextProfile || nextContests || nextSubmissions);
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
      } else if (!hasCoreData) {
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
      }

      setLoading(false);

      if (hasCoreData && infoStatus !== 400 && infoStatus !== 429) {
        persistCache({
          profile: nextProfile,
          contests: nextContests,
          submissions: nextSubmissions,
          problems: null,
          submissionsComplete: false,
          problemsLoaded: false,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handle, reloadToken, persistCache]);

  const refetch = useCallback(() => {
    clearCache(handle);
    fullFetchRef.current = null;
    setReloadToken((t) => t + 1);
  }, [handle]);

  return {
    profile,
    contests,
    submissions,
    problems,
    loading,
    loadingMore,
    submissionsComplete,
    problemsLoaded,
    error,
    status,
    retryAfter,
    refetch,
    ensureFullHistory,
  };
}

export default useCodeforcesData;
