import { memo, useMemo } from 'react';
import GlassCard from './ui/GlassCard';
import EmptyState from './ui/EmptyState';
import YearFilter from './ui/YearFilter';
import VerdictDistribution from '../charts/VerdictDistribution';
import { useYearFilter } from '../hooks/useYearFilter';
import { computeSubmissionStats } from '../utils/statCalculators';
import { ALL_VERDICTS, VERDICT_COLORS } from '../constants/verdicts';
import type { CFSubmission } from '../types';

interface SubmissionStatsProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function SubmissionStats({ submissions }: SubmissionStatsProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );
  const stats = useMemo(() => computeSubmissionStats(filtered), [filtered]);

  const filterBar = (
    <div className="mb-3 flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (filtered.length === 0) {
    return (
      <div>
        {filterBar}
        <EmptyState text="No submissions for this period." />
      </div>
    );
  }

  return (
    <div>
      {filterBar}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard className="p-4">
          <VerdictDistribution submissions={filtered} enableYearFilter={false} />
        </GlassCard>
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-lg bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-white/40">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            {ALL_VERDICTS.map((v) => (
              <div key={v} className="rounded-lg bg-white/5 p-3">
                <p
                  className="flex items-center gap-2 text-xs uppercase tracking-wide"
                  style={{ color: VERDICT_COLORS[v] }}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: VERDICT_COLORS[v] }}
                  />
                  {v}
                </p>
                <p className="text-xl font-bold">{stats.verdictCounts[v] ?? 0}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default memo(SubmissionStats);
