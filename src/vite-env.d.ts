/// <reference types="vite/client" />

declare module 'react-calendar-heatmap' {
  import type { ReactElement } from 'react';

  export interface HeatmapValue {
    date: string | Date;
    count?: number;
    [key: string]: unknown;
  }

  export interface CalendarHeatmapProps {
    values: HeatmapValue[];
    startDate?: string | Date;
    endDate?: string | Date;
    showWeekdayLabels?: boolean;
    showMonthLabels?: boolean;
    showOutOfRangeDays?: boolean;
    horizontal?: boolean;
    gutterSize?: number;
    classForValue?: (value: HeatmapValue | null) => string;
    titleForValue?: (value: HeatmapValue | null) => string;
    tooltipDataAttrs?:
      | Record<string, string>
      | ((value: HeatmapValue | null) => Record<string, string>);
    onClick?: (value: HeatmapValue | null) => void;
    onMouseOver?: (event: unknown, value: HeatmapValue | null) => void;
    onMouseLeave?: (event: unknown, value: HeatmapValue | null) => void;
    transformDayElement?: (
      element: ReactElement,
      value: HeatmapValue | null,
      index: number,
    ) => ReactElement;
  }

  const CalendarHeatmap: (props: CalendarHeatmapProps) => ReactElement;
  export default CalendarHeatmap;
}
