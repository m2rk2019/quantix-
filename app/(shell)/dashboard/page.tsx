import { Suspense } from 'react';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ExecutiveDashboardModule } from '@/features/dashboard/components/ExecutiveDashboardModule';
import { DashboardPageSkeleton } from '@/features/dashboard/components/DashboardSkeleton';
import { canCreateProject } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import {
  getExecutiveDashboard,
  parseDashboardFilters,
} from '@/services/dashboard/get-executive-dashboard';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const { profile } = await getAuthUser();
  const filters = parseDashboardFilters(params);
  const data = await getExecutiveDashboard(filters);

  const showCreateButton = profile ? canCreateProject(profile.role) : false;

  return (
    <PageContainer className="bg-[#F8FAFC]">
      <header className="dashboard-fade-in mb-8 border-b border-border/50 pb-8 opacity-0">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Executive Dashboard
            </h1>
            <p className="text-base font-medium text-muted-foreground md:text-lg">
              Portfolio Analytics &amp; Insights
            </p>
            {profile && (
              <p className="text-sm text-muted-foreground/90">
                Welcome back, {profile.full_name}
              </p>
            )}
          </div>
          {showCreateButton && (
            <Button
              asChild
              className="h-11 shrink-0 rounded-xl bg-[#E31E24] px-5 text-white shadow-sm transition-all hover:bg-[#c91a1f] hover:shadow-md focus-visible:ring-[#E31E24]"
            >
              <a href={ROUTES.projectNew}>+ Create Project</a>
            </Button>
          )}
        </div>
      </header>

      <Suspense fallback={<DashboardPageSkeleton />}>
        <ExecutiveDashboardModule data={data} filterParams={params} />
      </Suspense>
    </PageContainer>
  );
}
