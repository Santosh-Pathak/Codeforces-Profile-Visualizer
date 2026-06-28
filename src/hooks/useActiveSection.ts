import { useEffect, useState } from 'react';
import { NAV_SECTIONS } from '../components/layout/navSections';

/** Tracks which section is currently in view via IntersectionObserver. */
export function useActiveSection(): string {
  const [active, setActive] = useState<string>(NAV_SECTIONS[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    const nodes = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (n): n is HTMLElement => n != null,
    );
    nodes.forEach((n) => observer.observe(n));

    return () => observer.disconnect();
  }, []);

  return active;
}
