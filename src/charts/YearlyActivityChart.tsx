import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { computeActivityByYear } from '../utils/statCalculators';
import EmptyState from '../components/ui/EmptyState';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

interface YearlyActivityChartProps {
  submissions: CFSubmission[] | null;
}

function YearlyActivityChart({ submissions }: YearlyActivityChartProps) {
  const defaults = useChartDefaults();
  const entries = useMemo(() => {
    const map = computeActivityByYear(submissions);
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [submissions]);

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels: entries.map(([year]) => String(year)),
      datasets: [
        {
          label: 'Submissions',
          data: entries.map(([, count]) => count),
          backgroundColor: '#f59e0b',
          borderRadius: 3,
        },
      ],
    }),
    [entries],
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'bar'>),
        plugins: { ...defaults.plugins, legend: { display: false } },
      }) as ChartOptions<'bar'>,
    [defaults],
  );

  if (entries.length === 0) {
    return <EmptyState text="No submissions yet." />;
  }

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}

export default memo(YearlyActivityChart);
