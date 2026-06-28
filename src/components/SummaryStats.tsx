import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  FlagIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import GlassCard from './ui/GlassCard';
import AnimatedNumber from './ui/AnimatedNumber';
import { computeContestStats } from '../utils/statCalculators';
import { fadeSlideUp, staggerContainer } from '../utils/motionVariants';
import type { CFRatingChange, CFUserInfo } from '../types';

interface SummaryStatsProps {
  contests: CFRatingChange[] | null;
  profile: CFUserInfo | null;
}

interface Card {
  label: string;
  value: number | null;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

function SummaryStats({ contests, profile }: SummaryStatsProps) {
  const cards = useMemo<Card[]>(() => {
    const stats = computeContestStats(contests);
    const hasContests = stats.total > 0;
    return [
      { label: 'Current Rating', value: profile?.rating ?? null, icon: StarIcon },
      { label: 'Max Rating', value: profile?.maxRating ?? null, icon: ArrowTrendingUpIcon },
      { label: 'Total Contests', value: hasContests ? stats.total : null, icon: FlagIcon },
      { label: 'Best Rank', value: hasContests ? stats.bestRank : null, icon: TrophyIcon },
      { label: 'Worst Rank', value: hasContests ? stats.worstRank : null, icon: ChartBarIcon },
      { label: 'Average Rank', value: hasContests ? stats.avgRank : null, icon: CalculatorIcon },
      { label: 'Highest Gain', value: hasContests ? stats.largestGain : null, icon: ArrowUpIcon },
      { label: 'Biggest Loss', value: hasContests ? stats.largestDrop : null, icon: ArrowDownIcon },
    ];
  }, [contests, profile]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={fadeSlideUp}>
            <GlassCard className="p-4">
              <Icon className="mb-2 h-6 w-6 text-blue-400" />
              <p className="text-xs uppercase tracking-wide text-white/40">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {card.value == null ? (
                  '—'
                ) : (
                  <AnimatedNumber target={card.value} />
                )}
              </p>
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default memo(SummaryStats);
