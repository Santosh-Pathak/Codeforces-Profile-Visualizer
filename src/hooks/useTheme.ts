import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'cf-theme';

function readInitial(): Theme {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('light') ? 'light' : 'dark';
  }
  return 'dark';
}

let current: Theme = readInitial();
const listeners = new Set<() => void>();

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable — ignore */
  }
}

/** Sets the theme globally and notifies every subscriber. */
export function setTheme(theme: Theme) {
  if (theme === current) return;
  current = theme;
  apply(theme);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Shared theme state. Backed by a module-level store (via useSyncExternalStore)
 * so the toggle button and every chart re-render together when the theme flips.
 * The initial class is set pre-paint by an inline script in index.html.
 */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  const toggle = useCallback(
    () => setTheme(current === 'dark' ? 'light' : 'dark'),
    [],
  );
  return { theme, toggle, setTheme };
}
