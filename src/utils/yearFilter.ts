export type YearSelection = number | 'all';

/** Calendar year of a unix timestamp (seconds). */
export function yearOf(timestampSeconds: number): number {
  return new Date(timestampSeconds * 1000).getFullYear();
}

/**
 * Returns a descending list of years from the current year down to the earliest
 * year present in `timestamps` (the start of the user's contribution). Always
 * includes at least the current year.
 */
export function getAvailableYears(timestamps: number[]): number[] {
  const current = new Date().getFullYear();
  let min = current;
  for (const ts of timestamps) {
    const y = yearOf(ts);
    if (y < min) min = y;
  }
  const years: number[] = [];
  for (let y = current; y >= min; y--) years.push(y);
  return years;
}

/** Filters items to the selected year. 'all' returns everything. */
export function filterByYear<T>(
  items: T[] | null,
  getTs: (item: T) => number,
  selection: YearSelection,
): T[] {
  if (!items) return [];
  if (selection === 'all') return items;
  return items.filter((item) => yearOf(getTs(item)) === selection);
}
