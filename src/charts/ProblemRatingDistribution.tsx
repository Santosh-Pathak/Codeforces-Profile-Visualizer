import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { BIN_LABELS, binByRating } from '../utils/problemBinner';
import { problemKey } from '../utils/statCalculators';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission, CFProblem } from '../types';

interface ProblemRatingDistributionProps {
  submissions: CFSubmission[] | null;
  problems: CFProblem[] | null;
  enableYearFilter?: boolean;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function ProblemRatingDistribution({
  submissions,
  problems,
  enableYearFilter = true,
}: ProblemRatingDistributionProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );
  const defaults = useChartDefaults();
  const source = useMemo(
    () => (enableYearFilter ? filtered : (submissions ?? [])),
    [enableYearFilter, filtered, submissions],
  );

  void problems;

  const counts = useMemo(() => {
    const solvedProblems: CFProblem[] = [];
    const seen = new Set<string>();
    for (const s of source) {
      if (s.verdict !== 'OK') continue;
      const key = problemKey(s.problem);
      if (seen.has(key)) continue;
      seen.add(key);
      solvedProblems.push(s.problem);
    }
    return binByRating(solvedProblems);
  }, [source]);

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels: BIN_LABELS,
      datasets: [
        {
          label: 'Solved',
          data: counts,
          backgroundColor: '#06b6d4',
          borderRadius: 2,
        },
      ],
    }),
    [counts],
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'bar'>),
        plugins: { ...defaults.plugins, legend: { display: false } },
      }) as ChartOptions<'bar'>,
    [defaults],
  );

  return (
    <div>
      {enableYearFilter && (
        <div className="mb-3 flex justify-end">
          <YearFilter years={years} value={selection} onChange={setSelection} />
        </div>
      )}
      {source.length === 0 ? (
        <EmptyState text="No submissions for this period." />
      ) : (
        <div className="h-64 w-full">
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
}

export default memo(ProblemRatingDistribution);
