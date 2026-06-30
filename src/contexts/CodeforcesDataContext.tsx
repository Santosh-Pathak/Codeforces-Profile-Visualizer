import { createContext, useContext, type ReactNode } from 'react';
import type { UseCodeforcesDataResult } from '../types';

const CodeforcesDataContext = createContext<UseCodeforcesDataResult | null>(null);

export function CodeforcesDataProvider({
  value,
  children,
}: {
  value: UseCodeforcesDataResult;
  children: ReactNode;
}) {
  return (
    <CodeforcesDataContext.Provider value={value}>
      {children}
    </CodeforcesDataContext.Provider>
  );
}

export function useCodeforcesDataContext(): UseCodeforcesDataResult {
  const ctx = useContext(CodeforcesDataContext);
  if (!ctx) {
    throw new Error('useCodeforcesDataContext must be used within CodeforcesDataProvider');
  }
  return ctx;
}

/** Optional access for hooks that may render outside the dashboard provider. */
export function useCodeforcesDataContextOptional(): UseCodeforcesDataResult | null {
  return useContext(CodeforcesDataContext);
}
