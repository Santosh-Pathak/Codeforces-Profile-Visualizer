import { useEffect, useMemo, useState } from 'react';
import {
  getAvailableYears,
  filterByYear,
  type YearSelection,
} from '../utils/yearFilter';
import { selectionNeedsFullHistory } from '../utils/dataCoverage';
import { useCodeforcesDataContextOptional } from '../contexts/CodeforcesDataContext';

export interface UseYearFilterOptions {
  /** When true, selecting older years / all time triggers a full history fetch. */
  requiresFullHistory?: boolean;
}

export interface UseYearFilterResult<T> {
  years: number[];
  selection: YearSelection;
  setSelection: (value: YearSelection) => void;
  filtered: T[];
  loadingMore: boolean;
}

/**
 * Per-component year filtering. Defaults to the current calendar year and
 * exposes the list of selectable years (down to the earliest data point).
 */
export function useYearFilter<T>(
  items: T[] | null,
  getTs: (item: T) => number,
  options: UseYearFilterOptions = {},
): UseYearFilterResult<T> {
  const { requiresFullHistory = false } = options;
  const dataCtx = useCodeforcesDataContextOptional();

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

  useEffect(() => {
    if (!requiresFullHistory || !dataCtx) return;
    const needsMore = selectionNeedsFullHistory(
      items,
      getTs,
      selection,
      dataCtx.submissionsComplete,
    );
    if (needsMore) {
      void dataCtx.ensureFullHistory();
    }
  }, [
    requiresFullHistory,
    dataCtx,
    items,
    getTs,
    selection,
  ]);

  return {
    years,
    selection,
    setSelection,
    filtered,
    loadingMore: requiresFullHistory && (dataCtx?.loadingMore ?? false),
  };
}
