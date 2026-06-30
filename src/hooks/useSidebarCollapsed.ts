import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

const STORAGE_KEY = 'cf-sidebar-collapsed';
const WIDTH_EXPANDED = '15rem';
const WIDTH_COLLAPSED = '4.5rem';

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applySidebarWidth(collapsed: boolean) {
  document.documentElement.style.setProperty(
    '--sidebar-width',
    collapsed ? WIDTH_COLLAPSED : WIDTH_EXPANDED,
  );
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readInitial);

  useLayoutEffect(() => {
    applySidebarWidth(collapsed);
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* localStorage unavailable */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  return { collapsed, toggle, setCollapsed };
}
