import { memo, useMemo } from 'react';
import GlassCard from './ui/GlassCard';
import YearFilter from './ui/YearFilter';
import ProblemRatingDistribution from '../charts/ProblemRatingDistribution';
import { useYearFilter } from '../hooks/useYearFilter';
import {
  computeUniqueSolved,
  computeDifficultyStats,
  computeSubmissionStats,
} from '../utils/statCalculators';
import type { CFSubmission, CFProblem } from '../types';

interface ProblemStatsProps {
  submissions: CFSubmission[] | null;
  problems: CFProblem[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function ProblemStats({ submissions, problems }: ProblemStatsProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );

  const { totalSolved, uniqueSolved, difficulty } = useMemo(() => {
    const subStats = computeSubmissionStats(filtered);
    return {
      totalSolved: subStats.verdictCounts.AC ?? 0,
      uniqueSolved: computeUniqueSolved(filtered).size,
      difficulty: computeDifficultyStats(filtered),
    };
  }, [filtered]);

  const cards: { label: string; value: string | number }[] = [
    { label: 'Total Solved', value: totalSolved },
    { label: 'Unique Solved', value: uniqueSolved },
    { label: 'Average Difficulty', value: difficulty.avg ?? '—' },
    { label: 'Highest Difficulty', value: difficulty.max ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <YearFilter years={years} value={selection} onChange={setSelection} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-white/40">{c.label}</p>
            <p className="mt-1 text-2xl font-bold">{c.value}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-4">
        <ProblemRatingDistribution
          submissions={filtered}
          problems={problems}
          enableYearFilter={false}
        />
      </GlassCard>
    </div>
  );
}

export default memo(ProblemStats);
