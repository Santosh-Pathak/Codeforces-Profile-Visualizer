import { memo, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { formatDelta } from '../utils/formatters';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFRatingChange } from '../types';

interface RatingChangeChartProps {
  contests: CFRatingChange[] | null;
}

const getContestTs = (c: CFRatingChange) => c.ratingUpdateTimeSeconds;

function RatingChangeChart({ contests }: RatingChangeChartProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    contests,
    getContestTs,
  );
  const defaults = useChartDefaults();

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds,
      ),
    [filtered],
  );

  const data = useMemo<ChartData<'bar'>>(() => {
    const deltas = sorted.map((c) => c.newRating - c.oldRating);
    return {
      labels: sorted.map((c) => c.contestName),
      datasets: [
        {
          label: 'Rating Change',
          data: deltas,
          backgroundColor: deltas.map((d) => (d > 0 ? '#22c55e' : '#ef4444')),
          borderRadius: 3,
        },
      ],
    };
  }, [sorted]);

  const options = useMemo<ChartOptions<'bar'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'bar'>),
        plugins: {
          ...defaults.plugins,
          legend: { display: false },
          tooltip: {
            ...defaults.plugins?.tooltip,
            callbacks: {
              title: (items) => sorted[items[0]?.dataIndex ?? 0]?.contestName ?? '',
              label: (item) => {
                const c = sorted[item.dataIndex];
                if (!c) return '';
                const delta = c.newRating - c.oldRating;
                return [
                  `Old: ${c.oldRating}`,
                  `New: ${c.newRating}`,
                  `Delta: ${formatDelta(delta)}`,
                ];
              },
            },
          },
        },
      }) as ChartOptions<'bar'>,
    [sorted, defaults],
  );

  const overflow = sorted.length > 50;
  const width = overflow ? `${sorted.length * 14}px` : '100%';

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <YearFilter
          years={years}
          value={selection}
          onChange={setSelection}
          includeAll={false}
        />
      </div>
      {sorted.length === 0 ? (
        <EmptyState text="No contest data for this period." />
      ) : (
        <div className={`h-72 ${overflow ? 'overflow-x-auto' : ''}`}>
          <div style={{ width, height: '100%', minWidth: '100%' }}>
            <Bar data={data} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RatingChangeChart);
