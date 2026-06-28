import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface WarningBannerProps {
  message: string;
}

export default function WarningBanner({ message }: WarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !message) return null;

  return (
    <div className="warning-banner flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="text-amber-200/70 hover:text-amber-100"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
