import type { Variants } from 'framer-motion';

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export const shake = {
  x: [0, -8, 8, -8, 8, 0],
  transition: { duration: 0.4 },
};
