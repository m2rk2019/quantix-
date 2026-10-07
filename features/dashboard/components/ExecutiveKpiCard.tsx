'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import { AnimatedMetric } from './AnimatedMetric';

interface ExecutiveKpiCardProps {
  label: string;
  value: string;
  numericValue?: number;
  valueFormat?: 'number' | 'currency' | 'percent';
  decimals?: number;
  highlight?: boolean;
  icon: LucideIcon;
  index?: number;
  className?: string;
}

export function ExecutiveKpiCard({
  label,
  value,
  numericValue,
  valueFormat = 'number',
  decimals = 0,
  highlight = false,
  icon: Icon,
  index = 0,
  className,
}: ExecutiveKpiCardProps): React.JSX.Element {
  const animate = numericValue !== undefined && Number.isFinite(numericValue);

  return (
    <article
      className={cn(
        'dashboard-fade-in group rounded-2xl border bg-white p-6 opacity-0',
        'shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_20px_rgb(0_0_0/0.05)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_8px_28px_rgb(0_0_0/0.08)]',
        'focus-within:ring-2 focus-within:ring-[#E31E24] focus-within:ring-offset-2',
        highlight
          ? 'border-[#E31E24]/25 bg-gradient-to-br from-white via-white to-[#FEF2F2]/50'
          : 'border-border/60',
        className
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className={cn(
            'text-xs font-semibold uppercase tracking-wide',
            highlight ? 'text-[#E31E24]' : 'text-muted-foreground'
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300',
            highlight
              ? 'bg-[#E31E24] text-white shadow-sm group-hover:bg-[#c91a1f]'
              : 'bg-[#FEF2F2] text-[#E31E24] group-hover:bg-[#E31E24]/10'
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <p
        className={cn(
          'mt-4 tabular-nums tracking-tight',
          highlight
            ? 'text-3xl font-bold text-[#E31E24] md:text-[2rem]'
            : 'text-2xl font-semibold text-foreground'
        )}
      >
        {animate ? (
          <AnimatedMetric
            value={numericValue}
            format={valueFormat}
            decimals={decimals}
          />
        ) : (
          value
        )}
      </p>
    </article>
  );
}
