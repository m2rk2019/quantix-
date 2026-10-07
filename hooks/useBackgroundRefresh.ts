import { useCallback, useEffect, useRef } from 'react';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface UseBackgroundRefreshOptions {
  enabled?: boolean;
  intervalMs?: number;
  refreshOnReconnect?: boolean;
  onRefresh: () => void | Promise<void>;
}

export function useBackgroundRefresh({
  enabled = true,
  intervalMs = 60_000,
  refreshOnReconnect = true,
  onRefresh,
}: UseBackgroundRefreshOptions): { refreshNow: () => void } {
  const { isOnline } = useNetworkStatus();
  const wasOfflineRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const refreshNow = useCallback(() => {
    if (!enabled || !isOnline) {
      return;
    }

    void onRefreshRef.current();
  }, [enabled, isOnline]);

  useEffect(() => {
    if (!enabled || !isOnline) {
      return;
    }

    const timer = window.setInterval(() => {
      void onRefreshRef.current();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, intervalMs, isOnline]);

  useEffect(() => {
    if (!enabled || !refreshOnReconnect) {
      return;
    }

    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      void onRefreshRef.current();
    }
  }, [enabled, isOnline, refreshOnReconnect]);

  return { refreshNow };
}
