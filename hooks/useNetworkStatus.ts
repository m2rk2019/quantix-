import { useEffect, useState } from 'react';

export type NetworkStatus = 'online' | 'offline';

export function useNetworkStatus(): {
  status: NetworkStatus;
  isOnline: boolean;
  lastOnlineAt: number | null;
} {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);

  useEffect(() => {
    function syncStatus(): void {
      const online = window.navigator.onLine;
      setStatus(online ? 'online' : 'offline');
      if (online) {
        setLastOnlineAt(Date.now());
      }
    }

    syncStatus();
    window.addEventListener('online', syncStatus);
    window.addEventListener('offline', syncStatus);

    return () => {
      window.removeEventListener('online', syncStatus);
      window.removeEventListener('offline', syncStatus);
    };
  }, []);

  return {
    status,
    isOnline: status === 'online',
    lastOnlineAt,
  };
}
