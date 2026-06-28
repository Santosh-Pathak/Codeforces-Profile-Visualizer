import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { NAV_SECTIONS } from './navSections';

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-nav lg:hidden">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-gray-900/80 p-2 text-white backdrop-blur-md"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              className="fixed right-0 top-0 z-50 flex h-full w-64 flex-col gap-1 overflow-y-auto border-l border-white/10 bg-gray-950 p-5"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="mb-4 self-end rounded-lg p-1 text-white/70 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              {NAV_SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
