import type { ComponentType, SVGProps } from 'react';
import {
  UserCircleIcon,
  Squares2X2Icon,
  ChartBarIcon,
  ArrowsUpDownIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PaperAirplaneIcon,
  CodeBracketIcon,
  PuzzlePieceIcon,
  TagIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ClockIcon,
  ChartPieIcon,
  SignalIcon,
  LightBulbIcon,
  AcademicCapIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavSection {
  id: string;
  label: string;
  icon: NavIcon;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
  { id: 'summary-stats', label: 'Summary', icon: Squares2X2Icon },
  { id: 'rating-history', label: 'Rating History', icon: ChartBarIcon },
  { id: 'rating-changes', label: 'Rating Changes', icon: ArrowsUpDownIcon },
  { id: 'contest-table', label: 'Contests', icon: TableCellsIcon },
  {
    id: 'contest-analytics',
    label: 'Contest Analytics',
    icon: PresentationChartBarIcon,
  },
  { id: 'submissions', label: 'Submissions', icon: PaperAirplaneIcon },
  { id: 'languages', label: 'Languages', icon: CodeBracketIcon },
  { id: 'problems', label: 'Problems', icon: PuzzlePieceIcon },
  { id: 'tags', label: 'Tags', icon: TagIcon },
  { id: 'weak-topics', label: 'Weak Topics', icon: ArrowTrendingDownIcon },
  { id: 'strong-topics', label: 'Strong Topics', icon: ArrowTrendingUpIcon },
  { id: 'activity-heatmap', label: 'Activity', icon: CalendarDaysIcon },
  { id: 'daily-activity', label: 'By Weekday', icon: CalendarIcon },
  { id: 'monthly-activity', label: 'By Month', icon: ChartBarIcon },
  { id: 'yearly-activity', label: 'By Year', icon: ClockIcon },
  { id: 'verdict-distribution', label: 'Verdicts', icon: ChartPieIcon },
  { id: 'problem-rating', label: 'Problem Ratings', icon: SignalIcon },
  { id: 'ai-insights', label: 'AI Insights', icon: LightBulbIcon },
  { id: 'recommendations', label: 'Practice', icon: AcademicCapIcon },
  { id: 'achievements', label: 'Achievements', icon: TrophyIcon },
];
