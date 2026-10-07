'use client';

import {
  REVIEW_STATUS_COLORS,
  REVIEW_STATUS_LABELS,
  type TakeoffReviewStats,
} from '@/lib/takeoff/review';
import type { TakeoffReviewStatus } from '@/types/takeoff';

interface ReviewDashboardProps {
  stats: TakeoffReviewStats;
  filter: TakeoffReviewStatus | 'all' | 'pending';
  onFilter: (filter: TakeoffReviewStatus | 'all' | 'pending') => void;
}

export function ReviewDashboard({
  stats,
  filter,
  onFilter,
}: ReviewDashboardProps): React.JSX.Element {
  const cards: Array<{
    key: TakeoffReviewStatus | 'all' | 'pending';
    label: string;
    value: number;
    color: string;
  }> = [
    { key: 'all', label: 'Total', value: stats.total, color: '#334155' },
    {
      key: 'pending',
      label: 'Pending',
      value: stats.pending_review,
      color: '#f59e0b',
    },
    {
      key: 'approved',
      label: REVIEW_STATUS_LABELS.approved,
      value: stats.approved,
      color: REVIEW_STATUS_COLORS.approved,
    },
    {
      key: 'rejected',
      label: REVIEW_STATUS_LABELS.rejected,
      value: stats.rejected,
      color: REVIEW_STATUS_COLORS.rejected,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Review
      </span>
      {cards.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onFilter(c.key)}
          className={`rounded-md border px-2.5 py-1 text-left transition ${
            filter === c.key
              ? 'border-foreground/30 bg-background shadow-sm'
              : 'border-transparent bg-background/60 hover:bg-background'
          }`}
        >
          <p className="text-[10px] text-muted-foreground">{c.label}</p>
          <p className="text-sm font-semibold" style={{ color: c.color }}>
            {c.value}
          </p>
        </button>
      ))}
    </div>
  );
}
