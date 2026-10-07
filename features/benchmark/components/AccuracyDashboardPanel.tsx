'use client';

import { formatCurrency } from '@/lib/format-currency';
import type { AccuracyDashboardData } from '@/types/benchmark';
import { ACCEPTANCE } from '@/lib/benchmark/comparison';

interface AccuracyDashboardPanelProps {
  data: AccuracyDashboardData;
}

function MetricCard({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number;
}): React.JSX.Element {
  const met = value >= target;
  return (
    <div
      className={`rounded-lg border p-4 ${met ? 'border-green-500/30 bg-green-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value.toFixed(1)}%</p>
      <p className="text-xs text-muted-foreground">Target ≥ {target}%</p>
    </div>
  );
}

export function AccuracyDashboardPanel({
  data,
}: AccuracyDashboardPanelProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div
        className={`rounded-lg border p-4 ${data.meets_acceptance ? 'border-green-500/40' : 'border-amber-500/40'}`}
      >
        <p className="text-sm font-medium">
          {data.meets_acceptance
            ? 'All acceptance criteria met — ready for pilot validation.'
            : 'Some acceptance criteria not yet met — review benchmark projects.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Overall Accuracy" value={data.overall_accuracy_percent} target={95} />
        <MetricCard label="Quantity Accuracy" value={data.quantity_accuracy_percent} target={ACCEPTANCE.quantity_accuracy} />
        <MetricCard label="Rate Accuracy" value={data.rate_accuracy_percent} target={ACCEPTANCE.rate_accuracy} />
        <MetricCard label="Cost Accuracy" value={data.cost_accuracy_percent} target={95} />
        <MetricCard label="Formula Accuracy" value={data.formula_accuracy_percent} target={ACCEPTANCE.formula_accuracy} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border">
          <h3 className="border-b px-4 py-3 text-sm font-semibold">Variance Heatmap</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2">Project</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Qty Δ%</th>
                  <th className="px-4 py-2 text-right">Rate Δ%</th>
                  <th className="px-4 py-2 text-right">Cost Δ%</th>
                </tr>
              </thead>
              <tbody>
                {data.variance_heatmap.map((row) => (
                  <tr key={row.project_code} className="border-b">
                    <td className="px-4 py-2 font-mono">{row.project_code}</td>
                    <td className="px-4 py-2">{row.archetype}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.quantity_variance_percent.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.rate_variance_percent.toFixed(1)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{row.cost_variance_percent.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border">
            <h3 className="border-b px-4 py-3 text-sm font-semibold">Largest Overruns</h3>
            <ul className="divide-y text-sm">
              {data.largest_overruns.slice(0, 5).map((row) => (
                <li key={row.id} className="flex justify-between gap-2 px-4 py-2">
                  <span className="truncate">{row.item_code} — {row.description.slice(0, 32)}</span>
                  <span className="shrink-0 tabular-nums text-red-600">
                    +{formatCurrency(row.cost_variance)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border">
            <h3 className="border-b px-4 py-3 text-sm font-semibold">Largest Savings</h3>
            <ul className="divide-y text-sm">
              {data.largest_savings.slice(0, 5).map((row) => (
                <li key={row.id} className="flex justify-between gap-2 px-4 py-2">
                  <span className="truncate">{row.item_code}</span>
                  <span className="shrink-0 tabular-nums text-green-700">
                    {formatCurrency(row.cost_variance)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border">
        <h3 className="border-b px-4 py-3 text-sm font-semibold">Lessons Learned</h3>
        <ul className="list-disc space-y-1 px-6 py-4 text-sm text-muted-foreground">
          {data.lessons_learned.map((lesson) => (
            <li key={lesson}>{lesson}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
