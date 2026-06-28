import type { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className = '',
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={`glass-card bg-white/5 backdrop-blur-md border border-white/10 rounded-xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
