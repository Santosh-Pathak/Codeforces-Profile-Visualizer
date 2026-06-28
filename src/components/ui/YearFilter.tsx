import type { YearSelection } from '../../utils/yearFilter';

interface YearFilterProps {
  years: number[];
  value: YearSelection;
  onChange: (value: YearSelection) => void;
  includeAll?: boolean;
  className?: string;
}

export default function YearFilter({
  years,
  value,
  onChange,
  includeAll = true,
  className = '',
}: YearFilterProps) {
  const current = new Date().getFullYear();

  return (
    <label className={`inline-flex items-center gap-2 text-xs text-white/40 ${className}`}>
      <span className="hidden sm:inline">Year</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === 'all' ? 'all' : Number(v));
        }}
        className="rounded-lg border border-white/10 bg-gray-900/70 px-3 py-1.5 text-sm text-white/80 focus:border-blue-500 focus:outline-none"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y === current ? 'Current' : y}
          </option>
        ))}
        {includeAll && <option value="all">All Time</option>}
      </select>
    </label>
  );
}
