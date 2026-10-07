'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { Pagination } from '@/components/ui/pagination';
import { AiInsightsPanel } from '@/features/dashboard/components/AiInsightsPanel';
import { DashboardFiltersBar } from '@/features/dashboard/components/DashboardFiltersBar';
import {
  DashboardChartsSkeleton,
  DashboardFiltersSkeleton,
} from '@/features/dashboard/components/DashboardSkeleton';
import { ExecutiveReportsToolbar } from '@/features/dashboard/components/ExecutiveReportsToolbar';
import { PortfolioKpiCards } from '@/features/dashboard/components/PortfolioKpiCards';
import { PortfolioProjectsTable } from '@/features/dashboard/components/PortfolioProjectsTable';
import { ProjectStatusPanel } from '@/features/dashboard/components/ProjectStatusPanel';
import { ROUTES } from '@/lib/constants/routes';
import type { ExecutiveDashboardData } from '@/types/dashboard';

const PortfolioChartsPanel = dynamic(
  () =>
    import('@/features/dashboard/components/PortfolioChartsPanel').then(
      (mod) => mod.PortfolioChartsPanel
    ),
  {
    loading: () => <DashboardChartsSkeleton />,
    ssr: false,
  }
);

interface ExecutiveDashboardModuleProps {
  data: ExecutiveDashboardData;
  filterParams: Record<string, string | undefined>;
}

export function ExecutiveDashboardModule({
  data,
  filterParams,
}: ExecutiveDashboardModuleProps): React.JSX.Element {
  return (
    <div className="dashboard-fade-in space-y-8 opacity-0">
      {data.mixed_currency_warning && (
        <p
          className="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          Portfolio contains multiple currencies. Totals are summed without FX conversion.
        </p>
      )}

      <Suspense fallback={<DashboardFiltersSkeleton />}>
        <DashboardFiltersBar
          initialSearch={filterParams.search ?? ''}
          initialClient={filterParams.client ?? ''}
          initialLocation={filterParams.location ?? ''}
          initialEstimator={filterParams.estimator ?? ''}
          initialStatus={filterParams.status ?? ''}
          initialDateFrom={filterParams.dateFrom ?? ''}
          initialDateTo={filterParams.dateTo ?? ''}
          estimators={data.estimators}
        />
      </Suspense>

      <PortfolioKpiCards data={data} />

      <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />}>
        <ExecutiveReportsToolbar />
      </Suspense>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Suspense fallback={<DashboardChartsSkeleton />}>
            <PortfolioChartsPanel data={data} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <ProjectStatusPanel data={data} />
          <AiInsightsPanel data={data} />
        </div>
      </div>

      <section aria-labelledby="dashboard-projects-heading">
        <h2
          id="dashboard-projects-heading"
          className="mb-4 text-xl font-semibold tracking-tight text-foreground"
        >
          Projects
        </h2>
        <PortfolioProjectsTable projects={data.projects} />
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          baseUrl={ROUTES.dashboard}
          searchParams={filterParams}
        />
      </section>
    </div>
  );
}
