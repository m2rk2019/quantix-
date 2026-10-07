'use client';

import { useEffect } from 'react';

import { logger } from '@/lib/logging/logger';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';

interface ShellErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ShellError({
  error,
  reset,
}: ShellErrorProps): React.JSX.Element {
  useEffect(() => {
    logger.error('Application error', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred. You can try again or return to the dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href={ROUTES.dashboard}>Go to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}
