import { memo, useMemo } from 'react';
import GlassCard from './ui/GlassCard';
import EmptyState from './ui/EmptyState';
import YearFilter from './ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { computeContestStats } from '../utils/statCalculators';
import type { CFRatingChange } from '../types';

interface ContestAnalyticsProps {
  contests: CFRatingChange[] | null;
}

const getContestTs = (c: CFRatingChange) => c.ratingUpdateTimeSeconds;

function ContestAnalytics({ contests }: ContestAnalyticsProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    contests,
    getContestTs,
  );
  const stats = useMemo(() => computeContestStats(filtered), [filtered]);

  const filterBar = (
    <div className="mb-3 flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (filtered.length === 0) {
    return (
      <div>
        {filterBar}
        <EmptyState text="No contest data for this period." />
      </div>
    );
  }

  const items: { label: string; value: string | number }[] = [
    { label: 'Total Contests', value: stats.total },
    { label: 'Average Rank', value: stats.avgRank ?? '—' },
    { label: 'Median Rank', value: stats.medianRank ?? '—' },
    { label: 'Best Rank', value: stats.bestRank ?? '—' },
    { label: 'Worst Rank', value: stats.worstRank ?? '—' },
    { label: 'Largest Gain', value: stats.largestGain ?? '—' },
    { label: 'Largest Drop', value: stats.largestDrop ?? '—' },
    {
      label: 'Consistency Score',
      value: stats.consistencyScore == null ? 'N/A' : stats.consistencyScore.toFixed(2),
    },
  ];

  return (
    <div>
      {filterBar}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((item) => (
          <GlassCard key={item.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-white/40">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-bold">{item.value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default memo(ContestAnalytics);
