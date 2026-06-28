import { memo, useCallback, useMemo, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
import GlassCard from './ui/GlassCard';
import EmptyState from './ui/EmptyState';
import YearFilter from './ui/YearFilter';
import { useYearFilter } from '../hooks/useYearFilter';
import { formatFullDate, formatDelta } from '../utils/formatters';
import {
  sortContests,
  type ContestSortColumn,
  type SortDirection,
} from '../utils/sortContests';
import type { CFRatingChange } from '../types';

interface ContestTableProps {
  contests: CFRatingChange[] | null;
}

const getContestTs = (c: CFRatingChange) => c.ratingUpdateTimeSeconds;

const PAGE_SIZE = 20;
const ROW_HEIGHT = 48;

const COLUMNS: { key: ContestSortColumn; label: string }[] = [
  { key: 'name', label: 'Contest' },
  { key: 'date', label: 'Date' },
  { key: 'rank', label: 'Rank' },
  { key: 'oldRating', label: 'Old' },
  { key: 'newRating', label: 'New' },
  { key: 'delta', label: 'Δ' },
];

function deltaClass(delta: number): string {
  return delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-white/60';
}

function Row({ contest }: { contest: CFRatingChange }) {
  const delta = contest.newRating - contest.oldRating;
  return (
    <>
      <span className="truncate pr-2" title={contest.contestName}>
        {contest.contestName}
      </span>
      <span>{formatFullDate(contest.ratingUpdateTimeSeconds)}</span>
      <span>{contest.rank}</span>
      <span>{contest.oldRating}</span>
      <span>{contest.newRating}</span>
      <span className={deltaClass(delta)}>{formatDelta(delta)}</span>
    </>
  );
}

const GRID = 'grid grid-cols-[2fr_1.2fr_0.7fr_0.7fr_0.7fr_0.7fr] items-center gap-2 px-4 text-sm';

function ContestTable({ contests }: ContestTableProps) {
  const { years, selection, setSelection, filtered } = useYearFilter(
    contests,
    getContestTs,
  );
  const [sortCol, setSortCol] = useState<ContestSortColumn>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);

  const handleSort = useCallback(
    (col: ContestSortColumn) => {
      if (col === sortCol) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortCol(col);
        setSortDir('asc');
      }
      setPage(0);
    },
    [sortCol],
  );

  const sorted = useMemo(
    () => sortContests(filtered, sortCol, sortDir),
    [filtered, sortCol, sortDir],
  );

  const virtualized = sorted.length > 100;
  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = useMemo(
    () => sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [sorted, page],
  );

  const filterBar = (
    <div className="mb-3 flex justify-end">
      <YearFilter years={years} value={selection} onChange={setSelection} />
    </div>
  );

  if (sorted.length === 0) {
    return (
      <GlassCard className="p-4">
        {filterBar}
        <EmptyState text="No contest data for this period." />
      </GlassCard>
    );
  }

  const Header = (
    <div className={`${GRID} border-b border-white/10 py-2 font-semibold text-white/70`}>
      {COLUMNS.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => handleSort(c.key)}
          className="flex items-center gap-1 text-left hover:text-white"
        >
          {c.label}
          {sortCol === c.key &&
            (sortDir === 'asc' ? (
              <ChevronUpIcon className="h-3 w-3" />
            ) : (
              <ChevronDownIcon className="h-3 w-3" />
            ))}
        </button>
      ))}
    </div>
  );

  const VirtualRow = ({ index, style }: ListChildComponentProps) => (
    <div
      style={style}
      className={`${GRID} border-b border-white/5 ${index % 2 ? 'bg-white/[0.02]' : ''}`}
    >
      <Row contest={sorted[index]} />
    </div>
  );

  return (
    <GlassCard className="overflow-hidden p-4">
      {filterBar}
      {Header}
      {virtualized ? (
        <FixedSizeList
          height={ROW_HEIGHT * 16}
          itemCount={sorted.length}
          itemSize={ROW_HEIGHT}
          width="100%"
        >
          {VirtualRow}
        </FixedSizeList>
      ) : (
        <div>
          {pageRows.map((c) => (
            <div
              key={`${c.contestId}-${c.ratingUpdateTimeSeconds}`}
              className={`${GRID} border-b border-white/5 py-3`}
            >
              <Row contest={c} />
            </div>
          ))}
          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded px-3 py-1 text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-white/50">
                Page {page + 1} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded px-3 py-1 text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

export default memo(ContestTable);
