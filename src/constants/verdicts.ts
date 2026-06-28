export const VERDICT_COLORS: Record<string, string> = {
  AC: '#22c55e',
  WA: '#ef4444',
  TLE: '#f59e0b',
  MLE: '#8b5cf6',
  RE: '#f97316',
  CE: '#06b6d4',
  Other: '#6b7280',
};

export const KNOWN_VERDICTS = ['AC', 'WA', 'TLE', 'MLE', 'RE', 'CE'] as const;

export const ALL_VERDICTS = [...KNOWN_VERDICTS, 'Other'] as const;

// Maps a raw Codeforces verdict string to one of our display buckets.
export function normalizeVerdict(verdict?: string): string {
  switch (verdict) {
    case 'OK':
      return 'AC';
    case 'WRONG_ANSWER':
      return 'WA';
    case 'TIME_LIMIT_EXCEEDED':
      return 'TLE';
    case 'MEMORY_LIMIT_EXCEEDED':
      return 'MLE';
    case 'RUNTIME_ERROR':
      return 'RE';
    case 'COMPILATION_ERROR':
      return 'CE';
    default:
      return 'Other';
  }
}
