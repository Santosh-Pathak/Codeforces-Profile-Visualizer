import { memo } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import GlassCard from './ui/GlassCard';
import { BADGE_DEFINITIONS } from '../constants/badges';
import { fadeSlideUp, staggerContainer } from '../utils/motionVariants';
import type { ComputedStats } from '../types';

interface AchievementsProps {
  stats: ComputedStats;
}

function Achievements({ stats }: AchievementsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
    >
      {BADGE_DEFINITIONS.map((badge) => {
        const unlocked = badge.condition(stats);
        const Icon = badge.icon;
        return (
          <motion.div key={badge.id} variants={fadeSlideUp}>
            <GlassCard
              className={`relative flex flex-col items-center gap-2 p-4 text-center transition ${
                unlocked ? '' : 'opacity-50 grayscale'
              }`}
            >
              <Icon
                className={`h-8 w-8 ${unlocked ? 'text-yellow-400' : 'text-white/40'}`}
              />
              <p className="text-sm font-medium">{badge.label}</p>
              {!unlocked && (
                <LockClosedIcon className="absolute right-2 top-2 h-4 w-4 text-white/30" />
              )}
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default memo(Achievements);
