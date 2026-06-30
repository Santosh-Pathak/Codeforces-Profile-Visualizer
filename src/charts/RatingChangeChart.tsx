import { memo, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import type { AnnotationOptions } from 'chartjs-plugin-annotation';
import { formatDelta } from '../utils/formatters';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import type { CFRatingChange } from '../types';

interface RatingChangeChartProps {
  contests: CFRatingChange[] | null;
}

const getContestTs = (c: CFRatingChange) => c.ratingUpdateTimeSeconds;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function RatingChangeChart({ contests }: RatingChangeChartProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    contests,
    getContestTs,
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => a.ratingUpdateTimeSeconds - b.ratingUpdateTimeSeconds,
      ),
    [filtered],
  );

  const chartModel = useMemo(() => {
    const rawDeltas = sorted.map((c) => c.newRating - c.oldRating);
    const center = mean(rawDeltas);
    const spread = stdDev(rawDeltas, center);
    const ucl = center + 3 * spread;
    const lcl = center - 3 * spread;

    // Shift values so the y-axis stays in the +y quadrant only.
    const offset = Math.min(0, lcl, ...rawDeltas);
    const shift = (value: number) => value - offset;
    const displayDeltas = rawDeltas.map(shift);

    const yMax = Math.max(shift(ucl), ...displayDeltas, 1) * 1.08;

    return {
      rawDeltas,
      displayDeltas,
      center,
      ucl,
      lcl,
      shift,
      yMax,
      offset,
    };
  }, [sorted]);

  const data = useMemo<ChartData<'line'>>(() => {
    const { displayDeltas } = chartModel;
    const lastBlackFrom = Math.max(0, displayDeltas.length - 3);

    return {
      datasets: [
        {
          label: 'Rating change',
          data: displayDeltas.map((y, i) => ({ x: i + 1, y })),
          borderColor: '#111827',
          borderWidth: 1.5,
          pointStyle: 'rect',
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: displayDeltas.map((_, i) =>
            i >= lastBlackFrom ? '#111827' : '#2563eb',
          ),
          pointBorderColor: '#111827',
          pointBorderWidth: 1,
          tension: 0,
          fill: false,
          showLine: displayDeltas.length > 1,
        },
      ],
    };
  }, [chartModel]);

  const options = useMemo<ChartOptions<'line'>>(() => {
    const { shift, yMax, center, ucl, lcl, offset } = chartModel;

    const controlLine = (
      id: string,
      value: number,
      color: string,
      label: string,
    ): Record<string, AnnotationOptions> => ({
      [id]: {
        type: 'line',
        yMin: shift(value),
        yMax: shift(value),
        borderColor: color,
        borderWidth: 2,
        drawTime: 'beforeDatasetsDraw',
        label: {
          display: true,
          content: label,
          position: 'start',
          backgroundColor: 'rgba(255,255,255,0.75)',
          color: '#111827',
          font: { size: 11, weight: 'normal' },
          padding: 4,
        },
      },
    });

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 8, right: 12, left: 4, bottom: 4 } },
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            ...controlLine('ucl', ucl, '#dc2626', 'Upper Control limit (UCL)'),
            ...controlLine('cl', center, '#1e3a8a', 'Center line (CL)'),
            ...controlLine('lcl', lcl, '#ca8a04', 'Lower Control limit (LCL)'),
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderColor: 'rgba(15,23,42,0.15)',
          borderWidth: 1,
          titleColor: '#0f172a',
          bodyColor: '#334155',
          padding: 10,
          callbacks: {
            title: (items) => {
              const idx = (items[0]?.parsed.x ?? 1) - 1;
              return sorted[idx]?.contestName ?? `Sample ${idx + 1}`;
            },
            label: (item) => {
              const idx = (item.parsed.x ?? 1) - 1;
              const c = sorted[idx];
              if (!c) return '';
              const delta = c.newRating - c.oldRating;
              return [
                `Sample: ${idx + 1}`,
                `Old: ${c.oldRating}`,
                `New: ${c.newRating}`,
                `Delta: ${formatDelta(delta)}`,
              ];
            },
            afterBody: () =>
              offset !== 0
                ? [`(Y-axis offset: +${offset} for +axis display)`]
                : [],
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: Math.max(sorted.length + 0.5, 1.5),
          title: {
            display: true,
            text: 'Sample',
            color: '#111827',
            font: { size: 13, weight: 'bold' },
          },
          ticks: {
            color: '#1f2937',
            stepSize: 1,
            callback: (value) => (Number(value) > 0 ? String(value) : ''),
          },
          grid: {
            color: 'rgba(107,114,128,0.45)',
            borderDash: [4, 4],
            drawBorder: true,
            borderColor: '#1e3a8a',
            borderWidth: 2,
          },
        },
        y: {
          min: 0,
          max: yMax,
          title: {
            display: true,
            text: 'Rating change',
            color: '#111827',
            font: { size: 13, weight: 'bold' },
          },
          ticks: {
            color: '#1f2937',
            callback: (value) => String(Number(value) + offset),
          },
          grid: {
            color: 'rgba(107,114,128,0.45)',
            borderDash: [4, 4],
            drawBorder: true,
            borderColor: '#1e3a8a',
            borderWidth: 2,
          },
        },
      },
      animation: { duration: 500, easing: 'easeInOutQuart' },
    } as ChartOptions<'line'>;
  }, [chartModel, sorted]);

  const overflow = sorted.length > 50;
  const width = overflow ? `${Math.max(sorted.length * 28, 600)}px` : '100%';

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
        <div
          className={`spc-chart-panel overflow-hidden rounded-sm border-2 border-[#1e3a8a] bg-gradient-to-b from-[#d4edda] to-[#fff9c4] ${
            overflow ? 'overflow-x-auto' : ''
          }`}
        >
          <div className="h-80 p-2" style={{ width, minWidth: '100%' }}>
            <Line data={data} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RatingChangeChart);
