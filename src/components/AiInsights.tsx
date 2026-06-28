import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LightBulbIcon } from '@heroicons/react/24/solid';
import GlassCard from './ui/GlassCard';
import { generateInsights } from '../utils/insightGenerator';
import { fadeSlideUp, staggerContainer } from '../utils/motionVariants';
import type { ComputedStats } from '../types';

interface AiInsightsProps {
  stats: ComputedStats;
}

function AiInsights({ stats }: AiInsightsProps) {
  const insights = useMemo(() => generateInsights(stats), [stats]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      {insights.map((insight, i) => (
        <motion.div key={i} variants={fadeSlideUp}>
          <GlassCard className="flex items-start gap-3 p-4">
            <LightBulbIcon className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <p className="text-sm text-white/80">{insight.text}</p>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default memo(AiInsights);
