import { memo, useMemo } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { computeLanguageStats } from '../utils/statCalculators';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import YearFilter from '../components/ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { useChartDefaults } from '../hooks/useChartDefaults';
import type { CFSubmission } from '../types';

interface LanguageBreakdownProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

const PALETTE = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#ef4444',
  '#a3e635',
  '#f97316',
  '#14b8a6',
];

function LanguageBreakdown({ submissions }: LanguageBreakdownProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );
  const defaults = useChartDefaults();

  const entries = useMemo(() => {
    const stats = computeLanguageStats(filtered);
    return Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const pieData = useMemo<ChartData<'pie'>>(
    () => ({
      labels: entries.map(([lang]) => lang),
      datasets: [
        {
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map((_, i) => PALETTE[i % PALETTE.length]),
          borderColor: 'rgba(0,0,0,0.2)',
          borderWidth: 1,
        },
      ],
    }),
    [entries],
  );

  const barData = useMemo<ChartData<'bar'>>(
    () => ({
      labels: entries.map(([lang]) => lang),
      datasets: [
        {
          label: 'Submissions',
          data: entries.map(([, count]) => count),
          backgroundColor: entries.map((_, i) => PALETTE[i % PALETTE.length]),
          borderRadius: 3,
        },
      ],
    }),
    [entries],
  );

  const barOptions = useMemo<ChartOptions<'bar'>>(
    () =>
      ({
        ...(defaults as ChartOptions<'bar'>),
        indexAxis: 'y',
        plugins: { ...defaults.plugins, legend: { display: false } },
      }) as ChartOptions<'bar'>,
    [defaults],
  );

  const pieOptions = useMemo<ChartOptions<'pie'>>(
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
      }) as ChartOptions<'pie'>,
    [defaults],
  );

  const filterBar = (
    <div className="flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        {filterBar}
        <EmptyState text="No submissions for this period." />
      </div>
    );
  }

  const [topLang, topCount] = entries[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge color="#3b82f6" size="md">
          Top: {topLang} ({topCount})
        </Badge>
        {filterBar}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-64">
          <Pie data={pieData} options={pieOptions} />
        </div>
        <div
          className="overflow-y-auto"
          style={{ height: Math.max(256, entries.length * 28) }}
        >
          <div style={{ height: Math.max(256, entries.length * 28) }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(LanguageBreakdown);
