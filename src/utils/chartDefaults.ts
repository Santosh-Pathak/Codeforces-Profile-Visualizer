import type { ChartOptions } from 'chart.js';
import type { Theme } from '../hooks/useTheme';

interface ChartPalette {
  grid: string;
  tick: string;
  legend: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipTitle: string;
  tooltipBody: string;
}

const PALETTES: Record<Theme, ChartPalette> = {
  dark: {
    grid: 'rgba(255,255,255,0.05)',
    tick: 'rgba(255,255,255,0.6)',
    legend: 'rgba(255,255,255,0.7)',
    tooltipBg: 'rgba(15,23,42,0.95)',
    tooltipBorder: 'rgba(255,255,255,0.1)',
    tooltipTitle: '#ffffff',
    tooltipBody: 'rgba(255,255,255,0.8)',
  },
  light: {
    grid: 'rgba(15,23,42,0.08)',
    tick: 'rgba(15,23,42,0.65)',
    legend: 'rgba(15,23,42,0.78)',
    tooltipBg: 'rgba(255,255,255,0.97)',
    tooltipBorder: 'rgba(15,23,42,0.12)',
    tooltipTitle: '#0f172a',
    tooltipBody: 'rgba(15,23,42,0.8)',
  },
};

export function getChartDefaults(theme: Theme): ChartOptions {
  const p = PALETTES[theme];
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: p.legend } },
      tooltip: {
        backgroundColor: p.tooltipBg,
        borderColor: p.tooltipBorder,
        borderWidth: 1,
        titleColor: p.tooltipTitle,
        bodyColor: p.tooltipBody,
        padding: 10,
      },
    },
    scales: {
      x: { grid: { color: p.grid }, ticks: { color: p.tick } },
      y: { grid: { color: p.grid }, ticks: { color: p.tick } },
    },
    animation: { duration: 600, easing: 'easeInOutQuart' },
  };
}

/** Default (dark) options — kept for any non-reactive consumers. */
export const CHART_DEFAULTS: ChartOptions = getChartDefaults('dark');
