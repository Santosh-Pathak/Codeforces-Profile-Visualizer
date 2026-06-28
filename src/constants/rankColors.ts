export const RANK_COLORS: Record<string, string> = {
  newbie: '#808080',
  pupil: '#008000',
  specialist: '#03A89E',
  expert: '#0000FF',
  'candidate master': '#AA00AA',
  master: '#FF8C00',
  'international master': '#FF8C00',
  grandmaster: '#FF0000',
  'international grandmaster': '#FF0000',
  'legendary grandmaster': '#FF0000',
};

export const DEFAULT_RANK_COLOR = '#94a3b8';

export function rankColor(rank?: string | null): string {
  if (!rank) return DEFAULT_RANK_COLOR;
  return RANK_COLORS[rank.toLowerCase()] ?? DEFAULT_RANK_COLOR;
}
