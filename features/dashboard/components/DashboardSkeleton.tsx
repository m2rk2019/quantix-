import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';

function DashboardCardSkeleton({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-white p-6 shadow-sm ${className ?? ''}`}
      aria-hidden
    >
      <Skeleton className="h-5 w-36" />
      <Skeleton className="mt-2 h-4 w-52" />
      <Skeleton className="mt-6 h-40 w-full rounded-xl" />
    </div>
  );
}

export function DashboardFiltersSkeleton(): React.JSX.Element {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm"
      aria-label="Loading filters"
      aria-busy
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function DashboardKpiSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Loading KPIs"
      aria-busy
    >
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

export function DashboardChartsSkeleton(): React.JSX.Element {
  return (
    <div
      className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
      aria-label="Loading charts"
      aria-busy
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <DashboardCardSkeleton
          key={index}
          className={index === 3 || index === 5 ? 'lg:col-span-2 xl:col-span-3' : undefined}
        />
      ))}
    </div>
  );
}

export function DashboardSidePanelsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4" aria-label="Loading panels" aria-busy>
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
    </div>
  );
}

export function DashboardPageSkeleton(): React.JSX.Element {
  return (
    <div className="dashboard-fade-in space-y-8 opacity-0">
      <div className="space-y-2 border-b border-border/40 pb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-5 w-56" />
      </div>
      <DashboardFiltersSkeleton />
      <DashboardKpiSkeleton />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DashboardChartsSkeleton />
        </div>
        <DashboardSidePanelsSkeleton />
      </div>
      <div>
        <Skeleton className="mb-4 h-7 w-32" />
        <TableSkeleton rows={6} columns={5} />
      </div>
    </div>
  );
}
