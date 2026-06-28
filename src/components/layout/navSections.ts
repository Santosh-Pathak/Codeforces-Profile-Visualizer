export interface NavSection {
  id: string;
  label: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'summary-stats', label: 'Summary' },
  { id: 'rating-history', label: 'Rating History' },
  { id: 'rating-changes', label: 'Rating Changes' },
  { id: 'contest-table', label: 'Contests' },
  { id: 'contest-analytics', label: 'Contest Analytics' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'languages', label: 'Languages' },
  { id: 'problems', label: 'Problems' },
  { id: 'tags', label: 'Tags' },
  { id: 'weak-topics', label: 'Weak Topics' },
  { id: 'strong-topics', label: 'Strong Topics' },
  { id: 'activity-heatmap', label: 'Activity' },
  { id: 'daily-activity', label: 'By Weekday' },
  { id: 'monthly-activity', label: 'By Month' },
  { id: 'yearly-activity', label: 'By Year' },
  { id: 'verdict-distribution', label: 'Verdicts' },
  { id: 'problem-rating', label: 'Problem Ratings' },
  { id: 'ai-insights', label: 'AI Insights' },
  { id: 'recommendations', label: 'Practice' },
  { id: 'achievements', label: 'Achievements' },
];
