'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants/routes';
import { clearRecentProjectId } from '@/lib/navigation/recent-project';

export default function ProjectNotFoundPage(): React.JSX.Element {
  useEffect(() => {
    clearRecentProjectId();
  }, []);

  return (
    <PageContainer>
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Project unavailable
        </h1>
        <p className="text-muted-foreground">
          This project does not exist, was deleted, or you may not have access
          to it.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild>
            <Link href={ROUTES.dashboard}>Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.projects}>View Projects</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
