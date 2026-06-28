import type { RatingBand } from '../types';

export const RATING_BANDS: RatingBand[] = [
  { label: 'Newbie', min: 0, max: 1199, color: 'rgba(128,128,128,0.15)' },
  { label: 'Pupil', min: 1200, max: 1399, color: 'rgba(0,128,0,0.15)' },
  { label: 'Specialist', min: 1400, max: 1599, color: 'rgba(3,168,158,0.15)' },
  { label: 'Expert', min: 1600, max: 1899, color: 'rgba(0,0,255,0.15)' },
  { label: 'Candidate Master', min: 1900, max: 2099, color: 'rgba(170,0,170,0.15)' },
  { label: 'Master', min: 2100, max: 2299, color: 'rgba(255,140,0,0.15)' },
  { label: 'International Master', min: 2300, max: 2399, color: 'rgba(255,140,0,0.15)' },
  { label: 'Grandmaster', min: 2400, max: 2599, color: 'rgba(255,0,0,0.15)' },
  { label: 'IGM', min: 2600, max: 2999, color: 'rgba(255,0,0,0.15)' },
  { label: 'LGM', min: 3000, max: 9999, color: 'rgba(255,0,0,0.2)' },
];
