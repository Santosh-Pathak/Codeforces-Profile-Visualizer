import { memo, useMemo } from 'react';
import GlassCard from './ui/GlassCard';
import Badge from './ui/Badge';
import EmptyState from './ui/EmptyState';
import YearFilter from './ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { computeTagCounts } from '../utils/statCalculators';
import type { CFSubmission } from '../types';

interface StrongTopicsProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function StrongTopics({ submissions }: StrongTopicsProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
  );

  const strong = useMemo(() => {
    const counts = computeTagCounts(filtered);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [filtered]);

  const filterBar = (
    <div className="mb-3 flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (strong.length === 0) {
    return (
      <div>
        {filterBar}
        <EmptyState text="No solved problems for this period." />
      </div>
    );
  }

  return (
    <div>
      {filterBar}
      <GlassCard className="flex flex-wrap gap-3 p-5">
        {strong.map(([tag, count]) => (
          <Badge key={tag} color="#22c55e" size="lg">
            <span className="capitalize">{tag}</span>
            <span className="ml-1 rounded-full bg-white/10 px-1.5 text-xs">
              {count}
            </span>
          </Badge>
        ))}
      </GlassCard>
    </div>
  );
}

export default memo(StrongTopics);
