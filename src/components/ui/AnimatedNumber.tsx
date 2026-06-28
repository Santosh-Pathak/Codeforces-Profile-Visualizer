import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedNumberProps {
  target: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  target,
  duration = 1,
  className = '',
}: AnimatedNumberProps) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    Math.round(v).toLocaleString(),
  );

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration,
      ease: 'linear',
    });
    return controls.stop;
  }, [target, duration, motionVal]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
