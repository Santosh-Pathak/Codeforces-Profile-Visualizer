import {
  StarIcon,
  FireIcon,
  TrophyIcon,
  FlagIcon,
  AcademicCapIcon,
  BoltIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import type { BadgeDefinition } from '../types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'first_ac', label: 'First AC', icon: StarIcon, condition: (s) => s.totalAC >= 1 },
  { id: 'ac_10', label: '10 ACs', icon: FireIcon, condition: (s) => s.totalAC >= 10 },
  { id: 'ac_50', label: '50 ACs', icon: FireIcon, condition: (s) => s.totalAC >= 50 },
  { id: 'ac_100', label: '100 ACs', icon: TrophyIcon, condition: (s) => s.totalAC >= 100 },
  { id: 'ac_500', label: '500 ACs', icon: TrophyIcon, condition: (s) => s.totalAC >= 500 },
  { id: 'ac_1000', label: '1000 ACs', icon: TrophyIcon, condition: (s) => s.totalAC >= 1000 },
  { id: 'first_contest', label: 'First Contest', icon: FlagIcon, condition: (s) => s.totalContests >= 1 },
  { id: 'contest_10', label: '10 Contests', icon: FlagIcon, condition: (s) => s.totalContests >= 10 },
  { id: 'contest_50', label: '50 Contests', icon: FlagIcon, condition: (s) => s.totalContests >= 50 },
  // Rank tiers (by max rating)
  { id: 'rank_pupil', label: 'Pupil', icon: AcademicCapIcon, condition: (s) => (s.maxRating ?? 0) >= 1200 },
  { id: 'rank_specialist', label: 'Specialist', icon: AcademicCapIcon, condition: (s) => (s.maxRating ?? 0) >= 1400 },
  { id: 'rank_expert', label: 'Expert', icon: BoltIcon, condition: (s) => (s.maxRating ?? 0) >= 1600 },
  { id: 'rank_cm', label: 'Candidate Master', icon: BoltIcon, condition: (s) => (s.maxRating ?? 0) >= 1900 },
  { id: 'rank_master', label: 'Master', icon: SparklesIcon, condition: (s) => (s.maxRating ?? 0) >= 2100 },
  { id: 'rank_im', label: 'International Master', icon: SparklesIcon, condition: (s) => (s.maxRating ?? 0) >= 2300 },
  { id: 'rank_gm', label: 'Grandmaster', icon: ShieldCheckIcon, condition: (s) => (s.maxRating ?? 0) >= 2400 },
  { id: 'rank_igm', label: 'International Grandmaster', icon: ShieldCheckIcon, condition: (s) => (s.maxRating ?? 0) >= 2600 },
  { id: 'rank_lgm', label: 'Legendary Grandmaster', icon: RocketLaunchIcon, condition: (s) => (s.maxRating ?? 0) >= 3000 },
];
