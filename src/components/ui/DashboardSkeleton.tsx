import Skeleton from './Skeleton';
import GlassCard from './GlassCard';

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Profile card skeleton: avatar + 4 text lines */}
        <GlassCard className="flex items-center gap-6 p-6">
          <Skeleton width={96} height={96} rounded />
          <div className="flex-1 space-y-3">
            <Skeleton width="40%" height="1.5rem" />
            <Skeleton width="60%" />
            <Skeleton width="50%" />
            <Skeleton width="30%" />
          </div>
        </GlassCard>

        {/* 4 stat card skeletons */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassCard key={i} className="space-y-3 p-5">
              <Skeleton width={40} height={40} rounded />
              <Skeleton width="70%" />
              <Skeleton width="50%" height="1.5rem" />
            </GlassCard>
          ))}
        </div>

        {/* 2 chart skeletons at 16:9 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <GlassCard key={i} className="p-5">
              <Skeleton width="30%" className="mb-4" />
              <div className="aspect-video">
                <Skeleton width="100%" height="100%" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
