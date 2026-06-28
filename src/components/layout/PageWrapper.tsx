import type { ReactNode } from 'react';
import TopProgressBar from '../ui/TopProgressBar';
import ThemeToggle from '../ui/ThemeToggle';

interface PageWrapperProps {
  children: ReactNode;
  loading?: boolean;
}

export default function PageWrapper({ children, loading = false }: PageWrapperProps) {
  return (
    <div className="dashboard-root min-h-screen bg-gray-950 text-white">
      <TopProgressBar loading={loading} />
      <ThemeToggle className="fixed right-4 top-4 z-40" />
      {children}
    </div>
  );
}
