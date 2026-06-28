import { useEffect, useRef, useState } from 'react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';

interface RateLimitTimerProps {
  retryAfter: number;
  onRetry: () => void;
}

export default function RateLimitTimer({ retryAfter, onRetry }: RateLimitTimerProps) {
  const [seconds, setSeconds] = useState(retryAfter);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
      <GlassCard className="max-w-md p-8 text-center">
        <h2 className="text-xl font-bold text-amber-300">Rate limited</h2>
        <p className="mt-2 text-white/60">
          Codeforces is throttling requests. Please wait before retrying.
        </p>
        <p className="my-6 text-4xl font-bold tabular-nums">{seconds}s</p>
        <Button variant="primary" disabled={seconds > 0} onClick={onRetry}>
          {seconds > 0 ? 'Please wait…' : 'Retry now'}
        </Button>
      </GlassCard>
    </div>
  );
}
