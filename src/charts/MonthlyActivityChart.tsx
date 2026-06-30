import { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { computeActivityByMonth } from '../utils/statCalculators';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface MonthlyActivityChartProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function MonthlyActivityChart({ submissions }: MonthlyActivityChartProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );
  const defaults = useChartDefaults();
  const counts = useMemo(() => computeActivityByMonth(filtered), [filtered]);

  const data = useMemo<ChartData<'line'>>(
    () => ({
      labels: MONTHS,
      datasets: [
        {
          label: 'Submissions',
          data: counts,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.2)',
          tension: 0.3,
          fill: true,
          pointRadius: 3,
        },
      ],
    }),
    [counts],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'line'>),
        plugins: { ...defaults.plugins, legend: { display: false } },
      }) as ChartOptions<'line'>,
    [defaults],
  );

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <YearFilter years={years} value={selection} onChange={setSelection} />
      </div>
      <div className="h-64 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

export default memo(MonthlyActivityChart);
