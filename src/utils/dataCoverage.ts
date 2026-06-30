import type { YearSelection } from './yearFilter';
import { yearOf } from './yearFilter';

/** True when the batch likely contains every item from `year` (newest-first feeds). */
export function historyCoversYear<T>(
  items: T[] | null,
  getTs: (item: T) => number,
  year: number,
): boolean {
  if (!items || items.length === 0) return true;

  const yearStart = new Date(year, 0, 1).getTime() / 1000;
  const hasInYear = items.some((item) => yearOf(getTs(item)) === year);
  if (!hasInYear) return true;

  let oldest = Infinity;
  for (const item of items) {
    const ts = getTs(item);
    if (ts < oldest) oldest = ts;
  }
  return oldest < yearStart;
}

export function selectionNeedsFullHistory<T>(
  items: T[] | null,
  getTs: (item: T) => number,
  selection: YearSelection,
  submissionsComplete: boolean,
): boolean {
  if (submissionsComplete) return false;
  if (selection === 'all') return true;
  return !historyCoversYear(items, getTs, selection);
}
