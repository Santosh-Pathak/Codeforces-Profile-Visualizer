import type { CFRatingChange } from '../types';

export type ContestSortColumn =
  | 'name'
  | 'date'
  | 'rank'
  | 'oldRating'
  | 'newRating'
  | 'delta';

export type SortDirection = 'asc' | 'desc';

function valueFor(c: CFRatingChange, column: ContestSortColumn): number | string {
  switch (column) {
    case 'name':
      return c.contestName;
    case 'date':
      return c.ratingUpdateTimeSeconds;
    case 'rank':
      return c.rank;
    case 'oldRating':
      return c.oldRating;
    case 'newRating':
      return c.newRating;
    case 'delta':
      return c.newRating - c.oldRating;
  }
}

export function sortContests(
  contests: CFRatingChange[],
  column: ContestSortColumn,
  direction: SortDirection,
): CFRatingChange[] {
  const sorted = [...contests].sort((a, b) => {
    const va = valueFor(a, column);
    const vb = valueFor(b, column);
    let cmp: number;
    if (typeof va === 'string' && typeof vb === 'string') {
      cmp = va.localeCompare(vb);
    } else {
      cmp = (va as number) - (vb as number);
    }
    return direction === 'asc' ? cmp : -cmp;
  });
  return sorted;
}
