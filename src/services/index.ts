import { request } from './apiClient';
import type {
  NormalizedResponse,
  CFUserInfo,
  CFRatingChange,
  CFSubmission,
  CFProblemset,
  CFContest,
} from '../types';

export { axiosInstance, BASE_URL } from './apiClient';

export async function getUserInfo(
  handle: string,
  signal?: AbortSignal,
): Promise<NormalizedResponse<CFUserInfo>> {
  const res = await request<CFUserInfo[]>(
    `/user.info?handles=${encodeURIComponent(handle)}`,
    signal,
  );
  return {
    ...res,
    data: res.data && res.data.length > 0 ? res.data[0] : null,
  };
}

export function getUserRating(
  handle: string,
  signal?: AbortSignal,
): Promise<NormalizedResponse<CFRatingChange[]>> {
  return request<CFRatingChange[]>(
    `/user.rating?handle=${encodeURIComponent(handle)}`,
    signal,
  );
}

export function getUserStatus(
  handle: string,
  signal?: AbortSignal,
  count = 10_000,
): Promise<NormalizedResponse<CFSubmission[]>> {
  const safeCount = Math.min(Math.max(1, count), 10_000);
  return request<CFSubmission[]>(
    `/user.status?handle=${encodeURIComponent(handle)}&count=${safeCount}`,
    signal,
  );
}

export function getProblemset(
  signal?: AbortSignal,
): Promise<NormalizedResponse<CFProblemset>> {
  return request<CFProblemset>('/problemset.problems', signal);
}

export function getContestList(
  signal?: AbortSignal,
): Promise<NormalizedResponse<CFContest[]>> {
  return request<CFContest[]>('/contest.list', signal);
}
