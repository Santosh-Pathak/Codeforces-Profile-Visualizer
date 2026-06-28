import { useMemo, useState } from 'react';
import {
  getAvailableYears,
  filterByYear,
  type YearSelection,
} from '../utils/yearFilter';

export interface UseYearFilterResult<T> {
  years: number[];
  selection: YearSelection;
  setSelection: (value: YearSelection) => void;
  filtered: T[];
}

/**
 * Per-component year filtering. Defaults to the current calendar year and
 * exposes the list of selectable years (down to the earliest data point).
 */
export function useYearFilter<T>(
  items: T[] | null,
  getTs: (item: T) => number,
): UseYearFilterResult<T> {
  const years = useMemo(
    () => getAvailableYears((items ?? []).map(getTs)),
    [items, getTs],
  );
  const [selection, setSelection] = useState<YearSelection>(() =>
    new Date().getFullYear(),
  );
  const filtered = useMemo(
    () => filterByYear(items, getTs, selection),
    [items, getTs, selection],
  );
  return { years, selection, setSelection, filtered };
}
