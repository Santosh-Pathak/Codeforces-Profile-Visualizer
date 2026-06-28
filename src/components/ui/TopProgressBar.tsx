import { AnimatePresence, motion } from 'framer-motion';

interface TopProgressBarProps {
  loading: boolean;
}

export default function TopProgressBar({ loading }: TopProgressBarProps) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="top-progress-bar fixed left-0 top-0 z-[100] h-1 w-full bg-white/5"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '70%', '90%'] }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
