import { memo, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { VERDICT_COLORS, ALL_VERDICTS } from '../constants/verdicts';
import { computeSubmissionStats } from '../utils/statCalculators';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

interface VerdictDistributionProps {
  submissions: CFSubmission[] | null;
  enableYearFilter?: boolean;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function VerdictDistribution({
  submissions,
  enableYearFilter = true,
}: VerdictDistributionProps) {
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

  const stats = useMemo(() => computeSubmissionStats(source), [source]);

  const labels = ALL_VERDICTS.filter((v) => (stats.verdictCounts[v] ?? 0) > 0);

  const data = useMemo<ChartData<'doughnut'>>(
    () => ({
      labels: [...labels],
      datasets: [
        {
          data: labels.map((v) => stats.verdictCounts[v] ?? 0),
          backgroundColor: labels.map((v) => VERDICT_COLORS[v]),
          borderColor: 'rgba(0,0,0,0.2)',
          borderWidth: 1,
        },
      ],
    }),
    [labels, stats],
  );

  const options = useMemo<ChartOptions<'doughnut'>>(
    () =>
      ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: defaults.plugins?.legend?.labels?.color },
          },
          tooltip: defaults.plugins?.tooltip,
        },
        animation: defaults.animation,
      }) as ChartOptions<'doughnut'>,
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
        <div className="h-72 w-full">
          <Doughnut data={data} options={options} />
        </div>
      )}
    </div>
  );
}

export default memo(VerdictDistribution);
