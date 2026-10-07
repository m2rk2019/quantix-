import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  primary?: boolean;
  icon?: LucideIcon;
  className?: string;
}

export function KpiCard({
  label,
  value,
  primary = false,
  icon: Icon,
  className,
}: KpiCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'rounded-[14px] border border-border bg-card p-5 shadow-[0_1px_3px_0_rgb(0_0_0_/0.05)] card-interactive',
        primary && 'border-primary/20 bg-primary-subtle',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]',
              primary ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-3 tabular-nums',
          primary ? 'text-2xl font-bold text-primary' : 'text-xl font-semibold text-foreground'
        )}
      >
        {value}
      </p>
    </div>
  );
}
