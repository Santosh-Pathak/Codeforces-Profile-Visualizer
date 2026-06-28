import { InboxIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  text: string;
  className?: string;
}

export default function EmptyState({ text, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center text-white/50 ${className}`}
    >
      <InboxIcon className="h-12 w-12 text-white/20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
