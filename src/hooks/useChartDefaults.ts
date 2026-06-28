import { useMemo } from 'react';
import { useTheme } from './useTheme';
import { getChartDefaults } from '../utils/chartDefaults';

/** Theme-aware Chart.js base options that update when the theme toggles. */
export function useChartDefaults() {
  const { theme } = useTheme();
  return useMemo(() => getChartDefaults(theme), [theme]);
}
