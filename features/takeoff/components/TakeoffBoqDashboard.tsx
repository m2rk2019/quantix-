'use client';

import type { TakeoffBoqDashboardStats } from '@/lib/takeoff/boq-sync';

interface TakeoffBoqDashboardProps {
  stats: TakeoffBoqDashboardStats;
}

export function TakeoffBoqDashboard({
  stats,
}: TakeoffBoqDashboardProps): React.JSX.Element {
  const cards = [
    {
      label: 'Measured BOQ',
      value: stats.measured_boq_items,
      color: '#0284c7',
    },
    {
      label: 'Pending Assignment',
      value: stats.pending_assignment,
      color: '#d97706',
    },
    { label: 'Manual BOQ', value: stats.manual_boq, color: '#b45309' },
    { label: 'Imported BOQ', value: stats.imported_boq, color: '#7c3aed' },
    {
      label: 'Coverage',
      value: `${stats.coverage_percent}%`,
      color: '#15803d',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-sky-50/50 px-3 py-2 dark:bg-sky-950/20">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        BOQ Integration
      </span>
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-md border bg-background px-2.5 py-1"
        >
          <p className="text-[10px] text-muted-foreground">{c.label}</p>
          <p className="text-sm font-semibold" style={{ color: c.color }}>
            {c.value}
          </p>
        </div>
      ))}
      <span className="text-[10px] text-muted-foreground">
        of {stats.total_boq} BOQ items
      </span>
    </div>
  );
}
