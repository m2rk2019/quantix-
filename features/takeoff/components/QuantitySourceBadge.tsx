'use client';

import { QUANTITY_SOURCE_BADGES } from '@/lib/takeoff/boq-sync';
import { cn } from '@/lib/utils';
import type { BoqQuantitySource } from '@/lib/takeoff/boq-sync';

interface QuantitySourceBadgeProps {
  source: BoqQuantitySource | null | undefined;
  className?: string;
}

export function QuantitySourceBadge({
  source,
  className,
}: QuantitySourceBadgeProps): React.JSX.Element | null {
  const key = source ?? 'manual';
  const badge = QUANTITY_SOURCE_BADGES[key];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none',
        badge.className,
        className
      )}
      title={badge.label}
    >
      <span aria-hidden>{badge.emoji}</span>
      {badge.label}
    </span>
  );
}
