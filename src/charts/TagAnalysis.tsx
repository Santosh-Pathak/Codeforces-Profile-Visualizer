import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { computeTagCounts } from '../utils/statCalculators';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

interface TagAnalysisProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function TagAnalysis({ submissions }: TagAnalysisProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );
  const defaults = useChartDefaults();

  const top = useMemo(() => {
    const counts = computeTagCounts(filtered);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
  }, [filtered]);

  const data = useMemo<ChartData<'bar'>>(
    () => ({
      labels: top.map(([tag]) => tag),
      datasets: [
        {
          label: 'Solved',
          data: top.map(([, count]) => count),
          backgroundColor: '#8b5cf6',
          borderRadius: 3,
        },
      ],
    }),
    [top],
  );

  const options = useMemo<ChartOptions<'bar'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'bar'>),
        indexAxis: 'y',
        plugins: {
          ...defaults.plugins,
          legend: { display: false },
          datalabels: {
            anchor: 'end',
            align: 'end',
            color: defaults.plugins?.legend?.labels?.color,
            font: { size: 10 },
          },
        },
      }) as ChartOptions<'bar'>,
    [defaults],
  );

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <YearFilter years={years} value={selection} onChange={setSelection} />
      </div>
      {top.length === 0 ? (
        <EmptyState text="No solved problems for this period." />
      ) : (
        <div style={{ height: Math.max(300, top.length * 24) }}>
          <Bar data={data} options={options} plugins={[ChartDataLabels]} />
        </div>
      )}
    </div>
  );
}

export default memo(TagAnalysis);
