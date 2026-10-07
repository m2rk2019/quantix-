'use client';

import { useMemo, useState } from 'react';

import {
  formatSummaryMetric,
  summarizeByDiscipline,
  summarizeByLayer,
  summarizeByMeasurementType,
} from '@/lib/takeoff/summary';
import { cn } from '@/lib/utils';
import type { TakeoffLayer, TakeoffMeasurement } from '@/types/takeoff';

type SummaryTab = 'layer' | 'discipline' | 'type';

interface TakeoffSummaryBarProps {
  measurements: TakeoffMeasurement[];
  layers: TakeoffLayer[];
}

export function TakeoffSummaryBar({
  measurements,
  layers,
}: TakeoffSummaryBarProps): React.JSX.Element {
  const [tab, setTab] = useState<SummaryTab>('layer');

  const rows = useMemo(() => {
    if (tab === 'discipline') return summarizeByDiscipline(measurements);
    if (tab === 'type') return summarizeByMeasurementType(measurements);
    return summarizeByLayer(measurements, layers);
  }, [tab, measurements, layers]);

  return (
    <div className="shrink-0 border-t bg-background">
      <div className="flex items-center gap-2 border-b px-3 py-1.5">
        <p className="text-xs font-semibold text-muted-foreground">
          Takeoff Summary
        </p>
        {(
          [
            ['layer', 'By Layer'],
            ['discipline', 'By Discipline'],
            ['type', 'By Measurement Type'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded px-2 py-0.5 text-[10px]',
              tab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground">
          {measurements.length} total measurement
          {measurements.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex max-h-28 gap-2 overflow-x-auto px-3 py-2">
        {rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No takeoff quantities yet.</p>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="min-w-[160px] shrink-0 rounded-md border bg-muted/30 px-2 py-1.5"
            >
              <p className="truncate text-xs font-medium capitalize">
                {row.label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatSummaryMetric(row)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
