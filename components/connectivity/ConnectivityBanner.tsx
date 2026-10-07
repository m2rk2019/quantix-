'use client';

import { RefreshCw, WifiOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

interface ConnectivityBannerProps {
  onRetry?: () => void;
  className?: string;
}

export function ConnectivityBanner({
  onRetry,
  className,
}: ConnectivityBannerProps): React.JSX.Element | null {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">You are offline</p>
          <p className="text-muted-foreground">
            Changes are queued locally where possible. Reconnect to sync.
          </p>
        </div>
      </div>
      {onRetry ? (
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
