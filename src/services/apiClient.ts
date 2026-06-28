import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { NormalizedResponse } from '../types';

export const BASE_URL = 'https://codeforces.com/api';
export const TIMEOUT = 10_000;
export const MAX_RETRIES = 3;
export const BACKOFF_DELAYS = [1000, 2000, 4000];

interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

// Retry interceptor: network error or 5xx → exponential backoff up to 3 times.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount ?? 0;
    const status = error.response?.status;
    const is5xx = typeof status === 'number' && status >= 500;
    const isNetwork = !error.response;

    if ((is5xx || isNetwork) && config.__retryCount < MAX_RETRIES) {
      await sleep(BACKOFF_DELAYS[config.__retryCount]);
      config.__retryCount += 1;
      return axiosInstance(config);
    }
    return Promise.reject(error);
  },
);

interface CFApiEnvelope<T> {
  status: 'OK' | 'FAILED';
  result?: T;
  comment?: string;
}

export function normalize<T>(
  response: AxiosResponse<CFApiEnvelope<T>>,
): NormalizedResponse<T> {
  const payload = response.data;
  if (payload && payload.status === 'OK') {
    return { data: payload.result ?? null, error: null, status: response.status };
  }
  return {
    data: null,
    error: payload?.comment ?? 'Unexpected API response.',
    status: response.status,
  };
}

export function normalizeError<T>(error: unknown): NormalizedResponse<T> {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 400) {
      return { data: null, error: 'User not found. Check the handle.', status: 400 };
    }
    if (status === 429) {
      const header = error.response?.headers?.['retry-after'];
      const retryAfter = header != null ? Number(header) : NaN;
      return {
        data: null,
        error: 'Rate limited. Please wait before retrying.',
        status: 429,
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : 30,
      };
    }
    if (typeof status === 'number' && status >= 500) {
      return { data: null, error: 'Server error after 3 retries.', status };
    }
    if (typeof status === 'number') {
      // Codeforces returns 400 with a comment for bad handles, but some
      // failures surface a comment with a 200 envelope handled in normalize.
      const comment = (error.response?.data as CFApiEnvelope<T> | undefined)?.comment;
      return {
        data: null,
        error: comment ?? `Unexpected API error (status: ${status}).`,
        status,
      };
    }
    return { data: null, error: 'Network error. Check your connection.', status: 0 };
  }
  return { data: null, error: 'Network error. Check your connection.', status: 0 };
}

/** Performs a GET and returns a normalized response, never throwing. */
export async function request<T>(
  url: string,
  signal?: AbortSignal,
): Promise<NormalizedResponse<T>> {
  try {
    const response = await axiosInstance.get<CFApiEnvelope<T>>(url, { signal });
    return normalize<T>(response);
  } catch (error) {
    return normalizeError<T>(error);
  }
}
