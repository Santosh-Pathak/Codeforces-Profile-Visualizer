import { format, getDay } from 'date-fns';
import { normalizeVerdict } from '../constants/verdicts';
import type {
  CFRatingChange,
  CFSubmission,
  CFUserInfo,
  CFProblem,
  ContestStats,
  SubmissionStats,
  DifficultyStats,
  ComputedStats,
  HeatmapDatum,
  RatingTrend,
} from '../types';

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isAccepted(s: CFSubmission): boolean {
  return s.verdict === 'OK';
}

function problemKey(p: { contestId?: number; index: string }): string {
  return `${p.contestId ?? 'X'}-${p.index}`;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  const variance = mean(values.map((v) => (v - m) ** 2));
  return Math.sqrt(variance);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Consistency score = 1 - (stddev(changes) / mean(abs(changes))),
 * rounded to 2 decimals. Returns null on division-by-zero.
 */
export function computeConsistencyScore(ratingChanges: number[]): number | null {
  if (ratingChanges.length === 0) return null;
  const absMean = mean(ratingChanges.map(Math.abs));
  if (absMean === 0) return null;
  const score = 1 - stddev(ratingChanges) / absMean;
  return Math.round(score * 100) / 100;
}

export function computeContestStats(
  contests: CFRatingChange[] | null,
): ContestStats {
  const list = contests ?? [];
  if (list.length === 0) {
    return {
      total: 0,
      avgRank: null,
      medianRank: null,
      bestRank: null,
      worstRank: null,
      largestGain: null,
      largestDrop: null,
      consistencyScore: null,
    };
  }
  const ranks = list.map((c) => c.rank);
  const deltas = list.map((c) => c.newRating - c.oldRating);
  const gains = deltas.filter((d) => d > 0);
  const drops = deltas.filter((d) => d < 0);

  return {
    total: list.length,
    avgRank: Math.round(mean(ranks)),
    medianRank: median(ranks),
    bestRank: Math.min(...ranks),
    worstRank: Math.max(...ranks),
    largestGain: gains.length ? Math.max(...gains) : 0,
    largestDrop: drops.length ? Math.abs(Math.min(...drops)) : 0,
    consistencyScore: computeConsistencyScore(deltas),
  };
}

export function computeSubmissionStats(
  submissions: CFSubmission[] | null,
): SubmissionStats {
  const list = submissions ?? [];
  const verdictCounts: Record<string, number> = {
    AC: 0,
    WA: 0,
    TLE: 0,
    MLE: 0,
    RE: 0,
    CE: 0,
    Other: 0,
  };
  for (const s of list) {
    const bucket = normalizeVerdict(s.verdict);
    verdictCounts[bucket] = (verdictCounts[bucket] ?? 0) + 1;
  }
  return { total: list.length, verdictCounts };
}

/** Set of "contestId-index" keys among AC submissions. */
export function computeUniqueSolved(
  submissions: CFSubmission[] | null,
): Set<string> {
  const set = new Set<string>();
  for (const s of submissions ?? []) {
    if (isAccepted(s)) set.add(problemKey(s.problem));
  }
  return set;
}

/** Map of tag -> count over unique AC-solved problems. */
export function computeTagCounts(
  submissions: CFSubmission[] | null,
): Map<string, number> {
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const s of submissions ?? []) {
    if (!isAccepted(s)) continue;
    const key = problemKey(s.problem);
    if (seen.has(key)) continue;
    seen.add(key);
    for (const tag of new Set(s.problem.tags ?? [])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

/** Tag counts over ALL attempted problems (any verdict), deduped by problem. */
export function computeAttemptedTagCounts(
  submissions: CFSubmission[] | null,
): Map<string, number> {
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  for (const s of submissions ?? []) {
    const key = problemKey(s.problem);
    if (seen.has(key)) continue;
    seen.add(key);
    for (const tag of new Set(s.problem.tags ?? [])) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}

export function computeDifficultyStats(
  submissions: CFSubmission[] | null,
): DifficultyStats {
  const seen = new Set<string>();
  const ratings: number[] = [];
  for (const s of submissions ?? []) {
    if (!isAccepted(s)) continue;
    const key = problemKey(s.problem);
    if (seen.has(key)) continue;
    seen.add(key);
    if (typeof s.problem.rating === 'number') ratings.push(s.problem.rating);
  }
  if (ratings.length === 0) return { avg: null, max: null };
  return { avg: Math.round(mean(ratings)), max: Math.max(...ratings) };
}

export function computeLanguageStats(
  submissions: CFSubmission[] | null,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of submissions ?? []) {
    const lang = s.programmingLanguage || 'Unknown';
    counts.set(lang, (counts.get(lang) ?? 0) + 1);
  }
  return counts;
}

export function computeHeatmapData(
  submissions: CFSubmission[] | null,
): HeatmapDatum[] {
  const byDate = new Map<string, number>();
  for (const s of submissions ?? []) {
    if (!isAccepted(s)) continue;
    const date = format(new Date(s.creationTimeSeconds * 1000), 'yyyy-MM-dd');
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }
  return Array.from(byDate.entries()).map(([date, count]) => ({ date, count }));
}

/** Index 0 = Monday … 6 = Sunday. */
export function computeActivityByDow(
  submissions: CFSubmission[] | null,
): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const s of submissions ?? []) {
    const jsDay = getDay(new Date(s.creationTimeSeconds * 1000)); // 0=Sun..6=Sat
    const idx = (jsDay + 6) % 7; // shift so Monday=0
    counts[idx] += 1;
  }
  return counts;
}

/** Index 0 = January … 11 = December. */
export function computeActivityByMonth(
  submissions: CFSubmission[] | null,
): number[] {
  const counts = new Array<number>(12).fill(0);
  for (const s of submissions ?? []) {
    const month = new Date(s.creationTimeSeconds * 1000).getMonth();
    counts[month] += 1;
  }
  return counts;
}

export function computeActivityByYear(
  submissions: CFSubmission[] | null,
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const s of submissions ?? []) {
    const year = new Date(s.creationTimeSeconds * 1000).getFullYear();
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  return counts;
}

export function computeSubmissionFreq(
  submissions: CFSubmission[] | null,
): number {
  const list = submissions ?? [];
  if (list.length === 0) return 0;
  const days = new Set<string>();
  for (const s of list) {
    days.add(format(new Date(s.creationTimeSeconds * 1000), 'yyyy-MM-dd'));
  }
  if (days.size === 0) return 0;
  return Math.round((list.length / days.size) * 100) / 100;
}

function computeRatingTrend(contests: CFRatingChange[] | null): RatingTrend {
  const list = contests ?? [];
  if (list.length === 0) return null;
  const sorted = [...list].sort(
    (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds,
  );
  const recent = sorted.slice(-5);
  const delta = recent[recent.length - 1].newRating - recent[0].oldRating;
  if (delta > 0) return 'up';
  if (delta < 0) return 'down';
  return 'flat';
}

function topTags(counts: Map<string, number>, n: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag);
}

function bottomTags(counts: Map<string, number>, n: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([tag]) => tag);
}

export function computeComputedStats(
  profile: CFUserInfo | null,
  contests: CFRatingChange[] | null,
  submissions: CFSubmission[] | null,
  _problems: CFProblem[] | null,
): ComputedStats {
  const contestStats = computeContestStats(contests);
  const subStats = computeSubmissionStats(submissions);
  const uniqueSolved = computeUniqueSolved(submissions);
  const difficulty = computeDifficultyStats(submissions);
  const tagCounts = computeTagCounts(submissions);
  const langStats = computeLanguageStats(submissions);
  const dow = computeActivityByDow(submissions);

  const langEntries = Array.from(langStats.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const topLanguage = langEntries.length ? langEntries[0][0] : null;

  const maxDow = dow.reduce(
    (best, val, idx) => (val > dow[best] ? idx : best),
    0,
  );
  const mostActiveDow =
    (submissions?.length ?? 0) > 0 ? DOW_LABELS[maxDow] : null;

  const deltas = (contests ?? []).map((c) => c.newRating - c.oldRating);
  const biggestLoss = deltas.filter((d) => d < 0);

  return {
    totalAC: subStats.verdictCounts.AC ?? 0,
    uniqueSolved: uniqueSolved.size,
    avgDifficulty: difficulty.avg,
    highestDifficulty: difficulty.max,
    totalContests: contestStats.total,
    currentRating: profile?.rating ?? null,
    maxRating: profile?.maxRating ?? null,
    bestRank: contestStats.bestRank,
    worstRank: contestStats.worstRank,
    avgRank: contestStats.avgRank,
    highestGain: contestStats.largestGain,
    biggestLoss: biggestLoss.length ? Math.abs(Math.min(...biggestLoss)) : 0,
    consistencyScore: contestStats.consistencyScore,
    topLanguage,
    weakTags: bottomTags(tagCounts, 5),
    strongTags: topTags(tagCounts, 10),
    ratingTrend: computeRatingTrend(contests),
    submissionFreq: computeSubmissionFreq(submissions),
    mostActiveDow,
    rank: profile?.rank ?? null,
  };
}

export { DOW_LABELS, problemKey };
