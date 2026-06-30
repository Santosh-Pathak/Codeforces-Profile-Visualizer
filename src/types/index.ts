import type { ComponentType, SVGProps } from 'react';
import type {
  CFUserInfo,
  CFRatingChange,
  CFSubmission,
  CFProblem,
} from './codeforces';

export * from './codeforces';

// Normalized API response shape
export interface NormalizedResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  retryAfter?: number;
}

// Aggregated data returned by the data hook / persisted to cache
export interface CodeforcesData {
  profile: CFUserInfo | null;
  contests: CFRatingChange[] | null;
  submissions: CFSubmission[] | null;
  problems: CFProblem[] | null;
  submissionsComplete?: boolean;
  problemsLoaded?: boolean;
}

export interface UseCodeforcesDataResult extends CodeforcesData {
  loading: boolean;
  loadingMore: boolean;
  submissionsComplete: boolean;
  problemsLoaded: boolean;
  error: string | null;
  status: number | null;
  retryAfter: number | null;
  refetch: () => void;
  ensureFullHistory: () => Promise<void>;
}

export interface CacheEntry {
  timestamp: number;
  ttl: number;
  data: CodeforcesData;
}

// Derived statistics
export type RatingTrend = 'up' | 'down' | 'flat' | null;

export interface ContestStats {
  total: number;
  avgRank: number | null;
  medianRank: number | null;
  bestRank: number | null;
  worstRank: number | null;
  largestGain: number | null;
  largestDrop: number | null;
  consistencyScore: number | null;
}

export interface SubmissionStats {
  total: number;
  verdictCounts: Record<string, number>;
}

export interface DifficultyStats {
  avg: number | null;
  max: number | null;
}

export interface ComputedStats {
  totalAC: number;
  uniqueSolved: number;
  avgDifficulty: number | null;
  highestDifficulty: number | null;
  totalContests: number;
  currentRating: number | null;
  maxRating: number | null;
  bestRank: number | null;
  worstRank: number | null;
  avgRank: number | null;
  highestGain: number | null;
  biggestLoss: number | null;
  consistencyScore: number | null;
  topLanguage: string | null;
  weakTags: string[];
  strongTags: string[];
  ratingTrend: RatingTrend;
  submissionFreq: number;
  mostActiveDow: string | null;
  rank: string | null;
}

export interface HeatmapDatum {
  date: string;
  count: number;
}

export interface Insight {
  icon: string;
  text: string;
}

export interface BadgeDefinition {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  condition: (stats: ComputedStats) => boolean;
}

export interface RatingBand {
  label: string;
  min: number;
  max: number;
  color: string;
}
