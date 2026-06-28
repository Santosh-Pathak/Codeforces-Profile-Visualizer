import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { computeActivityByDow, DOW_LABELS } from '../utils/statCalculators';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

interface DailyActivityChartProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function DailyActivityChart({ submissions }: DailyActivityChartProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
  );
  const defaults = useChartDefaults();
  const counts = useMemo(() => computeActivityByDow(filtered), [filtered]);

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels: DOW_LABELS,
      datasets: [
        {
          label: 'Submissions',
          data: counts,
          backgroundColor: '#3b82f6',
          borderRadius: 3,
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
      <div className="mb-3 flex justify-end">
        <YearFilter years={years} value={selection} onChange={setSelection} />
      </div>
      <div className="h-64 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default memo(DailyActivityChart);
