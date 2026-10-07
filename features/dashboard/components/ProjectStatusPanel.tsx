'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SimpleBarChart } from '@/features/estimate/components/charts/EstimateCharts';
import type { ExecutiveDashboardData } from '@/types/dashboard';

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  estimating: '#3b82f6',
  review: '#8b5cf6',
  submitted: '#f59e0b',
  awarded: '#22c55e',
  archived: '#64748b',
};

const DASHBOARD_CARD =
  'rounded-2xl border border-border/60 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_rgb(0_0_0/0.05)]';

interface ProjectStatusPanelProps {
  data: ExecutiveDashboardData;
}

export function ProjectStatusPanel({
  data,
}: ProjectStatusPanelProps): React.JSX.Element {
  const bars = data.status_counts.map((item) => ({
    label: item.label,
    value: item.count,
    color: STATUS_COLORS[item.status] ?? '#64748b',
  }));

  const total = data.status_counts.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className={DASHBOARD_CARD}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Project Status</CardTitle>
        <CardDescription>
          Draft through archived — {total} project{total === 1 ? '' : 's'} in view
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <SimpleBarChart items={bars} height={220} />
        ) : (
          <p className="text-sm text-muted-foreground">No projects match current filters.</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {data.status_counts.map((item) => (
            <div
              key={item.status}
              className="rounded-xl border border-border/60 bg-[#F8FAFC] px-3 py-2.5 text-center"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold tabular-nums">{item.count}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
