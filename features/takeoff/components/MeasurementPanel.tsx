'use client';

import { measurementQuantityValue } from '@/lib/takeoff/boq-sync';
import { cn } from '@/lib/utils';
import type {
  TakeoffBoqLink,
  TakeoffLayer,
  TakeoffMeasurement,
  TakeoffSheet,
} from '@/types/takeoff';

interface MeasurementPanelProps {
  measurements: TakeoffMeasurement[];
  sheets: TakeoffSheet[];
  layers: TakeoffLayer[];
  links: TakeoffBoqLink[];
  boqLabels: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MeasurementPanel({
  measurements,
  sheets,
  layers,
  links,
  boqLabels,
  selectedId,
  onSelect,
}: MeasurementPanelProps): React.JSX.Element {
  const linkByMeas = new Map(links.map((l) => [l.measurement_id, l]));

  return (
    <div className="border-t">
      <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Measurement Panel
      </p>
      <div className="max-h-52 overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-muted/80 text-muted-foreground">
            <tr>
              <th className="px-2 py-1 text-left font-medium">Name</th>
              <th className="px-1 py-1 text-left font-medium">Sheet</th>
              <th className="px-1 py-1 text-left font-medium">Layer</th>
              <th className="px-1 py-1 text-right font-medium">Qty</th>
              <th className="px-1 py-1 text-left font-medium">BOQ</th>
              <th className="px-1 py-1 text-left font-medium">Updated</th>
              <th className="px-1 py-1 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {measurements.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-2 py-3 text-center text-muted-foreground"
                >
                  No measurements
                </td>
              </tr>
            ) : (
              measurements.map((m) => {
                const sheet = sheets.find((s) => s.id === m.sheet_id);
                const layer = layers.find((l) => l.id === m.layer_id);
                const link = linkByMeas.get(m.id);
                const qty = measurementQuantityValue(m);
                return (
                  <tr
                    key={m.id}
                    className={cn(
                      'cursor-pointer border-t hover:bg-muted/40',
                      selectedId === m.id && 'bg-sky-50 dark:bg-sky-950/40'
                    )}
                    onClick={() => onSelect(m.id)}
                  >
                    <td className="max-w-[72px] truncate px-2 py-1 font-medium">
                      {m.name ?? m.tool_type}
                    </td>
                    <td className="max-w-[56px] truncate px-1 py-1">
                      {sheet?.sheet_name ?? '—'}
                    </td>
                    <td className="max-w-[56px] truncate px-1 py-1">
                      {layer?.name ?? '—'}
                    </td>
                    <td className="px-1 py-1 text-right tabular-nums">
                      {qty.toFixed(2)}
                    </td>
                    <td className="max-w-[64px] truncate px-1 py-1">
                      {link
                        ? boqLabels[link.boq_id] ?? 'Linked'
                        : '—'}
                    </td>
                    <td className="max-w-[56px] truncate px-1 py-1">
                      {new Date(m.updated_at).toLocaleString()}
                    </td>
                    <td className="px-1 py-1 capitalize">
                      {m.review_status ?? 'draft'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t px-2 py-1 text-[9px] text-muted-foreground">
        Name · Sheet · Layer · Quantity · Assigned BOQ · Last Updated · Status
      </p>
    </div>
  );
}
