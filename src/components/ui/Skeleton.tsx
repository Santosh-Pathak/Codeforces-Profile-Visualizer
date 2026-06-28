interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}

export default function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = false,
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/10 ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={{ width, height }}
    />
  );
}
