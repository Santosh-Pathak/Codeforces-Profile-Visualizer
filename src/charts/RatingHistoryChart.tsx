import { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import type { AnnotationOptions } from 'chartjs-plugin-annotation';
import { RATING_BANDS } from '../constants/ratingBands';
import { formatContestDate, formatDelta } from '../utils/formatters';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFRatingChange } from '../types';

interface RatingHistoryChartProps {
  contests: CFRatingChange[] | null;
}

const getContestTs = (c: CFRatingChange) => c.ratingUpdateTimeSeconds;

function RatingHistoryChart({ contests }: RatingHistoryChartProps) {
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

  const data = useMemo<ChartData<'line'>>(() => {
    return {
      labels: sorted.map((c) => formatContestDate(c.ratingUpdateTimeSeconds)),
      datasets: [
        {
          label: 'Rating',
          data: sorted.map((c) => c.newRating),
          borderColor: '#3b82f6',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: sorted.length === 1 ? 8 : 2,
          pointHoverRadius: 6,
          showLine: sorted.length > 1,
          fill: true,
          backgroundColor: (ctx: ScriptableContext<'line'>) => {
            const { chart } = ctx;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(59,130,246,0.2)';
            const gradient = canvasCtx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            );
            gradient.addColorStop(0, 'rgba(59,130,246,0.5)');
            gradient.addColorStop(1, 'rgba(59,130,246,0)');
            return gradient;
          },
        },
      ],
    };
  }, [sorted]);

  const options = useMemo<ChartOptions<'line'>>(() => {
    const annotations: Record<string, AnnotationOptions> = {};
    RATING_BANDS.forEach((band, i) => {
      annotations[`band-${i}`] = {
        type: 'box',
        yMin: band.min,
        yMax: band.max,
        backgroundColor: band.color,
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
      };
    });

    return {
      ...(defaults as ChartOptions<'line'>),
      scales: {
        ...defaults.scales,
        y: {
          ...defaults.scales?.y,
          min: 0,
          max: 4000,
        },
      },
      plugins: {
        ...defaults.plugins,
        legend: { display: false },
        annotation: { annotations },
        zoom: {
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'x',
          },
          pan: { enabled: true, mode: 'x' },
        },
        tooltip: {
          ...defaults.plugins?.tooltip,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex ?? 0;
              return sorted[idx]?.contestName ?? '';
            },
            label: (item) => {
              const c = sorted[item.dataIndex];
              if (!c) return '';
              const delta = c.newRating - c.oldRating;
              return [`Rating: ${c.newRating}`, `Delta: ${formatDelta(delta)}`];
            },
          },
        },
      },
    } as ChartOptions<'line'>;
  }, [defaults, sorted]);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <YearFilter years={years} value={selection} onChange={setSelection} />
      </div>
      {sorted.length === 0 ? (
        <EmptyState text="No contest data for this period." />
      ) : (
        <div className="h-72 w-full">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  );
}

export default memo(RatingHistoryChart);
