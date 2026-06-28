import { memo, useMemo } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import GlassCard from './ui/GlassCard';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import { getRecommendations } from '../utils/recommendations';
import { computeUniqueSolved, computeComputedStats } from '../utils/statCalculators';
import type { CFUserInfo, CFSubmission, CFProblem } from '../types';

interface PracticeRecommendationsProps {
  profile: CFUserInfo | null;
  submissions: CFSubmission[] | null;
  problems: CFProblem[] | null;
}

function PracticeRecommendations({
  profile,
  submissions,
  problems,
}: PracticeRecommendationsProps) {
  const recommendations = useMemo(() => {
    const solved = computeUniqueSolved(submissions);
    const stats = computeComputedStats(profile, null, submissions, problems);
    return getRecommendations(problems, solved, profile?.rating, stats.weakTags, 20);
  }, [profile, submissions, problems]);

  if (recommendations.length === 0) {
    return <EmptyState text="No recommendations available right now." />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {recommendations.map((p) => (
        <GlassCard
          key={`${p.contestId}-${p.index}`}
          className="flex items-center justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="truncate font-medium" title={p.name}>
              {p.name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {p.rating != null && <Badge color="#3b82f6" size="sm" label={String(p.rating)} />}
              {(p.tags ?? []).slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <a
            href={`https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            Solve
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </GlassCard>
      ))}
    </div>
  );
}

export default memo(PracticeRecommendations);
