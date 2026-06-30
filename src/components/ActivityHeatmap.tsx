import { memo, useMemo } from 'react';
import CalendarHeatmap, { type HeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { format } from 'date-fns';
import GlassCard from './ui/GlassCard';
import Tooltip from './ui/Tooltip';
import YearFilter from './ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { computeHeatmapData } from '../utils/statCalculators';
import type { CFSubmission, HeatmapDatum } from '../types';

interface ActivityHeatmapProps {
  submissions: CFSubmission[] | null;
}

const getSubTs = (s: CFSubmission) => s.creationTimeSeconds;

function intensityClass(count: number): string {
  if (count <= 0) return 'cf-heat-0';
  if (count < 3) return 'cf-heat-1';
  if (count < 6) return 'cf-heat-2';
  if (count < 10) return 'cf-heat-3';
  return 'cf-heat-4';
}

function ActivityHeatmap({ submissions }: ActivityHeatmapProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    submissions,
    getSubTs,
    { requiresFullHistory: true },
  );

  const year =
    typeof selection === 'number' ? selection : new Date().getFullYear();
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  const { values, byDate } = useMemo(() => {
    const data: HeatmapDatum[] = computeHeatmapData(filtered);
    const map = new Map(data.map((d) => [d.date, d.count]));
    return { values: data as HeatmapValue[], byDate: map };
  }, [filtered]);

  const total = useMemo(
    () => Array.from(byDate.values()).reduce((a, b) => a + b, 0),
    [byDate],
  );

  return (
    <GlassCard className="cf-heatmap p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-white/50">
          {total} accepted submissions in {year}
        </p>
        <YearFilter
          years={years}
          value={selection}
          onChange={setSelection}
          includeAll={false}
        />
      </div>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        showWeekdayLabels
        classForValue={(value) =>
          intensityClass(value && 'count' in value ? (value.count ?? 0) : 0)
        }
        titleForValue={(value) => {
          if (!value || !value.date) return 'No submissions';
          const count = 'count' in value ? (value.count ?? 0) : 0;
          return `${count} on ${format(new Date(value.date), 'MMM d, yyyy')}`;
        }}
      />
      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-white/40">
        <span>Less</span>
        <span className="cf-legend cf-heat-0" />
        <span className="cf-legend cf-heat-1" />
        <span className="cf-legend cf-heat-2" />
        <span className="cf-legend cf-heat-3" />
        <span className="cf-legend cf-heat-4" />
        <span>More</span>
        <Tooltip content="Daily AC submission counts">
          <span className="ml-2 cursor-help underline decoration-dotted">info</span>
        </Tooltip>
      </div>
    </GlassCard>
  );
}

export default memo(ActivityHeatmap);
