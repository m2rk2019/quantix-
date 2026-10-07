'use client';

import { Badge } from '@/components/ui/badge';
import { formatCurrencyPHP } from '@/lib/format-currency';
import type { BenchmarkValidationResult } from '@/types/benchmark';
import { BENCHMARK_ARCHETYPE_LABELS } from '@/types/benchmark';

interface ValidationCenterPanelProps {
  result: BenchmarkValidationResult;
}

export function ValidationCenterPanel({
  result,
}: ValidationCenterPanelProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Quantity', result.quantity_accuracy_percent],
          ['Rate', result.rate_accuracy_percent],
          ['Cost', result.cost_accuracy_percent],
          ['Formula', result.formula_accuracy_percent],
          ['Consistency', result.calculation_consistency_percent],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">{label} Accuracy</p>
            <p className="text-xl font-bold tabular-nums">{Number(value).toFixed(1)}%</p>
          </div>
        ))}
      </div>

      {result.archetype && (
        <p className="text-sm text-muted-foreground">
          Archetype: {BENCHMARK_ARCHETYPE_LABELS[result.archetype]}
        </p>
      )}

      {result.findings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Automatic Findings</h3>
          {result.findings.map((finding) => (
            <div key={finding.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {finding.severity}
                </Badge>
                <span className="text-sm font-medium">{finding.title}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{finding.message}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2 text-right">Est Qty</th>
              <th className="px-3 py-2 text-right">Act Qty</th>
              <th className="px-3 py-2 text-right">Qty Δ%</th>
              <th className="px-3 py-2 text-right">Est Rate</th>
              <th className="px-3 py-2 text-right">Act Rate</th>
              <th className="px-3 py-2 text-right">Rate Δ%</th>
              <th className="px-3 py-2 text-right">Est Cost</th>
              <th className="px-3 py-2 text-right">Awarded</th>
              <th className="px-3 py-2 text-right">Cost Δ%</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="px-3 py-2 font-mono">{row.item_code}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.estimated_quantity}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.actual_quantity}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.quantity_variance_percent.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrencyPHP(row.estimated_unit_rate)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrencyPHP(row.actual_unit_rate)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.rate_variance_percent.toFixed(1)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrencyPHP(row.estimated_cost)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrencyPHP(row.awarded_cost)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.cost_variance_percent.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
