import { memo, useMemo } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import GlassCard from './ui/GlassCard';
import EmptyState from './ui/EmptyState';
import YearFilter from './ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { computeAttemptedTagCounts } from '../utils/statCalculators';
import type { CFSubmission } from '../types';

interface WeakTopicsProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function WeakTopics({ submissions }: WeakTopicsProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
  );

  const weak = useMemo(() => {
    const counts = computeAttemptedTagCounts(filtered);
    return Array.from(counts.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5);
  }, [filtered]);

  const filterBar = (
    <div className="mb-3 flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (weak.length === 0) {
    return (
      <div>
        {filterBar}
        <EmptyState text="Not enough data to identify weak topics." />
      </div>
    );
  }

  return (
    <div>
      {filterBar}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {weak.map(([tag, count]) => (
        <GlassCard key={tag} className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium capitalize">{tag}</p>
            <p className="text-sm text-white/40">{count} solved</p>
          </div>
          <a
            href={`https://codeforces.com/problemset?tags=${encodeURIComponent(tag)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            Practice
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </GlassCard>
        ))}
      </div>
    </div>
  );
}

export default memo(WeakTopics);
