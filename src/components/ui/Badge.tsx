import type { ReactNode } from 'react';

interface BadgeProps {
  color?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
  className?: string;
}

const SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export default function Badge({
  color,
  label,
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold border ${SIZES[size]} ${className}`}
      style={
        color
          ? { color, borderColor: `${color}55`, backgroundColor: `${color}1a` }
          : undefined
      }
    >
      {label ?? children}
    </span>
  );
}
